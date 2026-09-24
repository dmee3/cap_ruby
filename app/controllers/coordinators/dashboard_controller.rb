# frozen_string_literal: true

module Coordinators
  class DashboardController < CoordinatorsController
    def index
      season_id = current_season['id']
      @next_event = EventService.next_event(season_id)
      groups = ConflictTriagePresenter.groups_for(pending_conflicts(season_id), season_id, current_user)
      @pending_count = groups.sum { |group| group[:pending_count] }
      @oldest = groups.find { |group| group[:pending_count].positive? }
    end

    private

    def pending_conflicts(season_id)
      Conflict
        .includes(:conflict_status, user: :seasons_users)
        .for_season(season_id)
        .future_conflicts
        .order(:start_date)
        .select { |conflict| conflict.status.name == 'Pending' }
    end
  end
end
