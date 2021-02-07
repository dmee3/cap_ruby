# == Schema Information
#
# Table name: seasons
#
#  id         :integer          not null, primary key
#  year       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Season < ApplicationRecord
  has_many :conflicts
  has_many :payment_schedules
  has_many :payments

  has_many :seasons_users
  has_many :users, through: :seasons_users
end
