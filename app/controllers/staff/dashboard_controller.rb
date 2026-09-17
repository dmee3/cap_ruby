# frozen_string_literal: true

module Staff
  class DashboardController < StaffController
    WINDOW_DAYS = 14

    def index
      season_id = current_season['id']
      conflicts = upcoming_conflicts(season_id)

      @date_groups = StaffConflictPresenter.date_groups_for(conflicts, season_id)
      @out_count = conflicts.size
      @window_label = window_label
    end

    private

    def upcoming_conflicts(season_id)
      Conflict
        .includes(:conflict_status, user: :seasons_users)
        .for_season(season_id)
        .future_conflicts
        .where('end_date <= ?', WINDOW_DAYS.days.from_now)
        .order(:start_date)
    end

    def window_label
      "#{Date.current.strftime('%b %-d')} – #{WINDOW_DAYS.days.from_now.to_date.strftime('%b %-d')}"
    end
  end
end
