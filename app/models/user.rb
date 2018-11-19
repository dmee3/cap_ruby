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
  validates :email, uniqueness: { case_sensitive: false }
  validates :first_name, presence: { message: 'First name is required' }
  validates :last_name, presence: { message: 'Last name is required' }
  validates :password, presence: { message: 'password is required' }, on: :create
  validates :password, length: { minimum: 6, message: 'Password must be at least 6 characters' }, if: :password
  validates :password, confirmation: { message: 'Password confirmation must match password' }, if: :password
  validates :role, presence: { message: 'Role is required' }
  validates :username, presence: { message: 'Username is required' }
  validates :username, uniqueness: { case_sensitive: false }

  scope :for_season, ->(season_id) { joins(:seasons).where('seasons.id' => season_id) }
  scope :with_payments, -> { includes(:payments, payment_schedules: :payment_schedule_entries) }
  scope :with_role, ->(role) { where(role: Role.find_by_name(role.to_s)) }

  before_save do
    self.email = email.downcase
    self.username = username.downcase
  end

  after_save :create_payment_schedules

  def full_name
    return "#{first_name} #{last_name}" if first_name && last_name
    first_name
  end

  def dues_status_okay?(season_id)
    return nil unless is?(:member)
    return @status unless @status.nil?
    dues_paid = amount_paid_for(season_id)
    schedule = payment_schedule_for(season_id)
    @status = dues_paid >= schedule.scheduled_to_date
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

      # Pushing to the array doesn't technically do anything since we're in an
      # after_save block and won't save the object again...but it does make
      # tests pass when they call #payment_schedule_for after a save, because
      # Rspec is only using the object in memory
      payment_schedules << DefaultPaymentSchedule.create(id, season.id)
    end
  end
end
