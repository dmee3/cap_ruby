# frozen_string_literal: true

module Coordinators
  class DashboardController < CoordinatorsController
    REVIEW_LIMIT = 3

    def index
      season_id = current_season['id']
      @next_event = EventService.next_event(season_id)
      @groups = ConflictTriagePresenter.groups_for(pending_conflicts(season_id), season_id, current_user)
      @pending_count = @groups.sum { |group| group[:pending_count] }
      @oldest = @groups.find { |group| group[:pending_count].positive? }
      @review_rows = review_rows
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

    # The few a coordinator can clear without opening the queue.
    def review_rows
      @groups.flat_map do |group|
        group[:rows].map { |row| row.merge(member: group[:member], section: group[:section]) }
      end.first(REVIEW_LIMIT)
    end
  end
end
