# == Schema Information
#
# Table name: nine_volts
#
#  id        :integer          not null, primary key
#  turned_in :boolean
#  season_id :integer
#  user_id   :integer
#
# Indexes
#
#  index_nine_volts_on_season_id  (season_id)
#  index_nine_volts_on_user_id    (user_id)
#
class NineVolt < ApplicationRecord
  belongs_to :user
  belongs_to :season
end
