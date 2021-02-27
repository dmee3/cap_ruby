# == Schema Information
#
# Table name: payments
#
#  id              :integer          not null, primary key
#  amount          :integer
#  date_paid       :date
#  deleted_at      :datetime
#  notes           :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  payment_type_id :integer
#  season_id       :integer
#  user_id         :integer
#
# Indexes
#
#  index_payments_on_deleted_at       (deleted_at)
#  index_payments_on_payment_type_id  (payment_type_id)
#  index_payments_on_season_id        (season_id)
#  index_payments_on_user_id          (user_id)
#
class Payment < ApplicationRecord
  acts_as_paranoid
  belongs_to :user
  belongs_to :payment_type
  belongs_to :season

  validates :amount, presence: true
  validates :date_paid, presence: true
  validates :payment_type_id, presence: true
  validates :season_id, presence: true
  validates :user_id, presence: true

  scope :for_season, ->(season_id) { where(season_id: season_id) }
end
