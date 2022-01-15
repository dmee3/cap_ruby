# frozen_string_literal: true

# == Schema Information
#
# Table name: events
#
#  id         :integer          not null, primary key
#  end_date   :datetime
#  name       :string
#  start_date :datetime
#  season_id  :integer
#
# Indexes
#
#  index_events_on_season_id  (season_id)
#
class Event < ApplicationRecord
  belongs_to :season
end
