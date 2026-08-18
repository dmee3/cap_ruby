# frozen_string_literal: true

class EventService
  class << self
    def next_event(season_id)
      Event.where(season_id: season_id).where('end_date >= ?', Date.today).order(:start_date).first
    end
  end
end
