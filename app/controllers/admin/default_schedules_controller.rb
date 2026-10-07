# frozen_string_literal: true

module Admin
  # The season's default payment schedules, always for the admin's current
  # season. Each screen is a React island fed by DefaultSchedules::Overview.
  class DefaultSchedulesController < AdminController
    before_action :load_overview

    def index; end

    def copy
      @sources = Season.where(id: DefaultScheduleEntry.select(:season_id))
                       .where.not(id: current_season.id)
                       .order(year: :desc)
                       .map { |season| source_view(season) }
    end

    def dates; end

    def edit
      @combination = DefaultSchedules::Combination.from_slug(params[:combination])
      raise ActionController::RoutingError, 'Not Found' if @combination.nil?
    end

    private

    def load_overview
      @overview = DefaultSchedules::Overview.call(current_season)
    end

    def source_view(season)
      overview = DefaultSchedules::Overview.call(season)
      {
        id: season.id,
        year: season.year,
        combinations: overview[:combinations].select { |c| c[:set_up] }
                                             .map { |c| c.slice(:slug, :label, :entries, :total_cents) }
      }
    end
  end
end
