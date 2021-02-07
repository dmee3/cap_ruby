# == Schema Information
#
# Table name: seasons_users
#
#  id        :integer          not null, primary key
#  ensemble  :string
#  section   :string
#  season_id :integer
#  user_id   :integer
#
# Indexes
#
#  index_seasons_users_on_season_id  (season_id)
#  index_seasons_users_on_user_id    (user_id)
#
class SeasonsUser < ApplicationRecord
  belongs_to :season
  belongs_to :user
end
