class User < ApplicationRecord
  has_secure_password
  acts_as_paranoid

  belongs_to :role
  has_many :activities
  has_many :conflicts, dependent: :destroy
  has_many :payment_schedules, dependent: :destroy
  has_many :payment_schedule_entries, through: :payment_schedule
  has_many :payments, dependent: :destroy
  has_and_belongs_to_many :seasons

  validates :email, presence: { message: 'Email is required' }
  validates :email, uniqueness: true, case_sensitive: false
  validates :first_name, presence: { message: 'First name is required' }
  validates :last_name, presence: { message: 'Last name is required' }
  validates :password, presence: { message: 'password is required' }, on: :create
  validates :password, length: { minimum: 6, message: 'Password must be at least 6 characters' }, if: :password
  validates :password, confirmation: { message: 'Password confirmation must match password' }, if: :password
  validates :role, presence: { message: 'Role is required' }
  validates :username, uniqueness: true, case_sensitive: false

  scope :for_season, ->(season_id) { joins(:seasons).where('seasons.id' => season_id) }
  scope :role_for_season, ->(role, season_id) { joins(:seasons).where('seasons.id' => season_id, role: Role.find_by_name(role.to_s)) }

  before_save { self.email = email.downcase }
  after_save :create_payment_schedules

  def full_name
    "#{first_name} #{last_name}" if first_name && last_name
  end

  def dues_status_okay?(season_id)
    return nil unless role.name == 'member'
    return @status unless @status.nil?
    dues_paid = amount_paid_for(season_id)
    schedule = payment_schedule_for(season_id)
    @status = dues_paid >= schedule.entries.where('pay_date < ?', Date.today).sum(:amount)
  end

  def amount_paid_for(season_id)
    payments.where(season_id: season_id)&.sum(:amount)
  end

  def payment_schedule_for(season_id)
    payment_schedules.where(season_id: season_id).first
  end

  def payments_for(season_id)
    payments.where(season_id: season_id)
  end

  def total_dues_for(season_id)
    payment_schedule_for(season_id)&.entries&.sum(:amount)
  end

  def is?(name)
    role.name == name.to_s
  end

  private

  # Ensures that members have a payment schedule for each year they march
  def create_payment_schedules
    return unless is?(:member)
    seasons.each do |season|
      next if payment_schedules.find_by_season_id(season.id)
      DefaultPaymentSchedule.create(id, season.id)
    end
  end
end
