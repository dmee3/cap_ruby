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
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#  index_users_on_username              (username) UNIQUE
#
# rubocop:disable Metrics/ClassLength
class User < ApplicationRecord
  # Include devise modules. Others available are:
  #   :lockable, :registerable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable,
         :recoverable,
         :rememberable,
         :validatable,
         password_length: 8..128

  acts_as_paranoid

  has_many :activities
  has_many :conflicts, dependent: :destroy
  has_many :payment_schedules, dependent: :destroy
  has_many :payment_schedule_entries, through: :payment_schedule
  has_many :payments, dependent: :destroy

  has_many :seasons_users
  has_many :seasons, through: :seasons_users
  accepts_nested_attributes_for :seasons_users, allow_destroy: true

  validates :email, presence: true
  validates :email, uniqueness: { case_sensitive: false }
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :password, presence: true, on: :create
  validates :password, length: { minimum: 6, message: 'must be at least 6 characters' },
                       if: :password
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

  def dues_status_okay?(season_id)
    return @status unless @status.nil?

    dues_paid = amount_paid_for(season_id)
    schedule = payment_schedule_for(season_id)
    @status = schedule.present? && dues_paid >= schedule.scheduled_to_date
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

  def remaining_payments_for(season_id)
    paid = amount_paid_for(season_id)
    payment_schedule_for(season_id).entries.map do |e|
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
end
# rubocop:enable Metrics/ClassLength
