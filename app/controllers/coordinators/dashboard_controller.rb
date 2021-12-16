# frozen_string_literal: true

module Coordinators
  class DashboardController < CoordinatorsController
    def index
      @next_event = EventService.next_event(current_season['id'])
    end
  end
end
