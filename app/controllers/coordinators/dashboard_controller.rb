# frozen_string_literal: true

module Coordinators
  class DashboardController < CoordinatorsController
    def index
      @next_event = EventService.next_event
    end
  end
end
