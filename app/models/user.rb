class User < ApplicationRecord
  has_secure_password
  acts_as_paranoid

  belongs_to :role
  has_many :activities
  has_many :conflicts, dependent: :destroy
  has_one :payment_schedule, dependent: :destroy
  has_many :payment_schedule_entries, through: :payment_schedule
  has_many :payments, dependent: :destroy

  validates :first_name, presence: { message: 'First name is required' }
  validates :last_name, presence: { message: 'Last name is required' }
  validates :email, presence: { message: 'Email is required' }
  validates :password, presence: { message: 'password is required' }, on: :create
  validates :password, length: { minimum: 6, message: 'Password must be at least 6 characters' }, if: :password
  validates :password, confirmation: { message: 'Password confirmation must match password' }, if: :password
  validates :role, presence: { message: 'Role is required' }

  before_save { self.email = self.email.downcase }

  def full_name
    "#{first_name} #{last_name}" if first_name && last_name
  end

  def dues_status_okay?
    return nil unless role.name == 'member'
    @status ||= amount_paid >= payment_schedule_entries.where('pay_date < ?', Date.today).sum(:amount)
  end

  def amount_paid
    payments&.sum(:amount)
  end

  def total_dues
    payment_schedule&.payment_schedule_entries&.sum(:amount)
  end

  def is?(name)
    role.name == name
  end
end
