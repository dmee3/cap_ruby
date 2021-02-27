# == Schema Information
#
# Table name: bot_points
#
#  id         :integer          not null, primary key
#  name       :string
#  reason     :string
#  score      :integer          default(0)
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class BotPoint < ApplicationRecord
  has_many :bot_point_entries
end
