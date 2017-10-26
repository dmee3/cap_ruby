class User < ApplicationRecord
  has_secure_password
  acts_as_paranoid

  belongs_to :role
  has_many :conflicts, dependent: :destroy
  has_one :user_payment_schedule
  has_one :payment_schedule, through: :user_payment_schedule
  has_many :payments, dependent: :destroy

  validates :first_name, presence: { message: 'First name is required' }
  validates :last_name, presence: { message: 'Last name is required' }
  validates :email, presence: { message: 'Email is required' }
  validates :password, presence: { message: 'password is required' }, on: :create
  validates :password, length: { minimum: 6, message: 'Password must be at least 6 characters' }, if: :password
  validates :password, confirmation: { message: 'Password confirmation must match password' }, if: :password
  validates :role, presence: { message: 'Role is required' }
end
