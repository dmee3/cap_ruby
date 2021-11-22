# frozen_string_literal: true

module Staff
  class DashboardController < StaffController
    def index
      @next_event = EventService.next_event
      @upcoming_conflicts = Conflict
        .for_season(current_season['id'])
        .future_conflicts
        .where('end_date <= ?', 14.days.from_now)
    end
  end
end
