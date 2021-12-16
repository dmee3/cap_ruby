# frozen_string_literal: true

class EventService
  class << self
    def next_event(season_id)
      Event.where(season_id: season_id).select { |e| e[:end_date] >= Date.today }.first
    end
  end
end
