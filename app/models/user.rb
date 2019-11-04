class User < ApplicationRecord
  has_secure_password
  acts_as_paranoid

  belongs_to :role
  has_many :activities
  has_many :conflicts, dependent: :destroy
  has_many :payment_schedules, dependent: :destroy
  has_many :payment_schedule_entries, through: :payment_schedule
  has_many :payments, dependent: :destroy

  has_many :seasons_users
  has_many :seasons, through: :seasons_users

  has_many :nine_volts

  validates :email, presence: true
  validates :email, uniqueness: { case_sensitive: false }
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :password, presence: true, on: :create
  validates :password, length: { minimum: 6, message: 'Password must be at least 6 characters' }, if: :password
  validates :password, confirmation: { message: 'Password confirmation must match password' }, if: :password
  validates :role, presence: true
  validates :username, presence: true
  validates :username, uniqueness: { case_sensitive: false }

  scope :for_season, ->(season_id) {
    includes(:seasons)
      .joins(:seasons_users)
      .where('seasons_users.season_id' => season_id)
  }
  scope :with_payments, -> { includes(payments: :payment_type, payment_schedules: :payment_schedule_entries) }
  scope :with_role, ->(role) { where(role: Role.find_by_name(role.to_s)) }

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

  def amount_paid_for(season_id)
    # Using ruby methods instead of AR query builder to save DB calls
    # if we've got the object loaded in memory
    made_payments = payments.select { |p| p.season_id == season_id }
    made_payments.sum(&:amount)
  end

  def payment_schedule_for(season_id)
    payment_schedules.find { |s| s.season_id == season_id }
  end

  def payments_for(season_id)
    payments.select { |p| p.season_id == season_id }
  end

  # Using ruby methods instead of AR query builder to save DB calls
  # if we've got the object loaded in memory
  def section_for(season_id)
    seasons_users.select { |su| su.season_id == season_id }.first.section
  end

  def total_dues_for(season_id)
    payment_schedule_for(season_id)&.entries&.sum(:amount)
  end

  def is?(name)
    role.name == name.to_s
  end
end
