# == Schema Information
#
# Table name: activities
#
#  id            :integer          not null, primary key
#  activity_date :date
#  activity_type :string
#  description   :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  created_by_id :integer
#  user_id       :integer
#
# Indexes
#
#  index_activities_on_user_id  (user_id)
#
class Activity < ApplicationRecord
  belongs_to :user
end
