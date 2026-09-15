# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                     :integer          not null, primary key
#  deleted_at             :datetime
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  first_name             :string
#  inventory_access       :boolean          default(FALSE)
#  last_name              :string
#  phone                  :string
#  public_token           :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  username               :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#
# Indexes
#
#  index_users_on_deleted_at            (deleted_at)
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_public_token          (public_token) UNIQUE
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#  index_users_on_username              (username) UNIQUE
#
class User < ApplicationRecord
  # Include devise modules. Others available are:
  #   :lockable, :registerable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable,
         :recoverable,
         :rememberable,
         :validatable,
         password_length: 8..128

  acts_as_paranoid

  # The public fundraiser addresses a performer by this token, never by id or
  # name: the share URL travels through group texts and social posts, so it
  # mustn't publish a minor's name, and a sequential id would let anyone walk
  # the roster. Generated for every user, not just members, so someone who
  # joins a roster later already has a stable link.
  #
  # Rolled by hand rather than with `has_secure_token`, which enforces a
  # 24-character minimum — far longer than a link someone reads aloud or types
  # off a phone needs to be. 12 base58 characters is ~70 bits, and base58 keeps
  # the ambiguous 0/O/I/l out of it.
  PUBLIC_TOKEN_LENGTH = 12

  before_create :assign_public_token

  has_many :activities
  has_many :conflicts, dependent: :destroy
  has_many :payment_schedules, dependent: :destroy
  has_many :payment_schedule_entries, through: :payment_schedule
  has_many :payments, dependent: :destroy

  has_many :seasons_users
  has_many :seasons, through: :seasons_users
  accepts_nested_attributes_for :seasons_users, allow_destroy: true

  has_many :calendar_fundraisers, class_name: 'Calendar::Fundraiser'

  validates :email, presence: true
  validates :email, uniqueness: { case_sensitive: false }
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :password, presence: true, on: :create
  # NB: no separate length validation here. Devise's :validatable already
  # enforces password_length (8..128) above; a second 6-character rule only
  # ever fired alongside it, so a 5-character password produced two
  # contradictory messages ("minimum is 8" and "must be at least 6").
  validates_confirmation_of :password
  validates :username, presence: true
  validates :username, uniqueness: { case_sensitive: false }

  scope :for_season, lambda { |season_id|
    includes(:seasons)
      .joins(:seasons_users)
      .where('seasons_users.season_id' => season_id)
  }
  scope :members_for_season, lambda { |season_id|
    includes(:seasons)
      .joins(:seasons_users)
      .where('seasons_users.season_id' => season_id)
      .where('seasons_users.role' => 'member')
  }
  scope :with_payments, lambda {
    includes(payments: :payment_type, payment_schedules: :payment_schedule_entries)
  }
  scope :with_role_for_season, lambda { |role, season_id|
    includes(:seasons)
      .joins(:seasons_users)
      .where('seasons_users.season_id' => season_id)
      .where('seasons_users.role' => role)
  }

  before_save do
    self.email = email.downcase
    self.username = username.downcase
  end

  def full_name
    return "#{first_name} #{last_name}" if first_name && last_name

    first_name
  end

  # Memoized per season. It used to memoize a single @status regardless of the
  # season asked about, so the second season checked in a request came back with
  # the first season's answer.
  def dues_status_okay?(season_id)
    @dues_status ||= {}
    return @dues_status[season_id] if @dues_status.key?(season_id)

    dues_paid = amount_paid_for(season_id)
    schedule = payment_schedule_for(season_id)
    @dues_status[season_id] = schedule.present? && dues_paid >= schedule.scheduled_to_date
  end

  # NOTE: several of the following methods use Ruby methods instead of
  # AR query builder methods to save DB calls if we've got the object
  # loaded in memory
  def amount_paid_for(season_id)
    made_payments = payments.select { |p| p.season_id == season_id }
    made_payments.sum(&:amount)
  end

  # TODO: is there a way to use `select` here so we save on
  # N+1 calls from `total_dues_for` ??
  def payment_schedule_for(season_id)
    payment_schedules.find { |s| s.season_id == season_id }
  end

  def payments_for(season_id)
    payments.select { |p| p.season_id == season_id }
  end

  def section_for(season_id)
    seasons_users.select { |su| su.season_id == season_id }&.first&.section
  end

  def ensemble_for(season_id)
    seasons_users.select { |su| su.season_id == season_id }&.first&.ensemble
  end

  def role_for(season_id)
    seasons_users.select { |su| su.season_id == season_id }&.first&.role
  end

  def total_dues_for(season_id)
    payment_schedule_for(season_id)&.entries&.sum(:amount)
  end

  def calendar_fundraisers_for(season_id)
    calendar_fundraisers.where(season_id: season_id)
  end

  def vet_in?(season_id)
    role = seasons_users.select { |su| su.season_id == season_id }&.first
    return false unless role.present?

    seasons_users.any? { |su| su.season.year < role.season.year }
  end

  def remaining_payments_for(season_id)
    paid = amount_paid_for(season_id)
    payments = payment_schedule_for(season_id).entries.sort_by(&:pay_date)
    payments.map do |e|
      due = [e.amount - paid, 0].max
      paid = [paid - e.amount, 0].max
      {
        amount: due,
        pay_date: e.pay_date
      }
    end
  end

  def active_for_authentication?
    super && seasons_users.any?
  end

  def quartermaster?
    inventory_access
  end

  def welcome
    UserMailer.with(user: self).welcome_email.deliver_later
  end

  # Initials for the public fundraiser's avatar, which shows them until there
  # are performer photos.
  def initials
    [first_name, last_name].compact_blank.map { |n| n[0] }.join.upcase
  end

  # Uniqueness has to be checked `with_deleted`: the column is uniquely indexed
  # across the whole table, so colliding with a soft-deleted user's token would
  # raise rather than quietly reassign.
  def self.generate_public_token
    loop do
      token = SecureRandom.base58(PUBLIC_TOKEN_LENGTH)
      return token unless with_deleted.exists?(public_token: token)
    end
  end

  private

  def assign_public_token
    self.public_token = self.class.generate_public_token if public_token.blank?
  end
end
