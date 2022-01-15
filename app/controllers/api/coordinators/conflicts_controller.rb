# frozen_string_literal: true

module Api
  module Coordinators
    class ConflictsController < Api::CoordinatorsController
      def index
        @conflicts = Conflict
                     .includes(:conflict_status, user: :seasons_users)
                     .for_season(current_season['id'])
                     .where('start_date > ?', start_param)
                     .where('end_date < ?', end_param)
                     .order(:start_date)

        @conflicts = @conflicts.map do |c|
          {
            id: c.id,
            title: c.user.full_name,
            ensemble: c.user.ensemble_for(current_season['id']),
            section: c.user.section_for(current_season['id']),
            start: c.start_date,
            end: c.end_date,
            reason: c.reason,
            status: c.status,
            created_at: c.created_at
          }
        end
        render json: @conflicts
      end

      def update
        @conflict = Conflict.find(params[:id])
        if @conflict.update(conflict_params.reject { |_k, v| v.blank? })
          ActivityLogger.log_conflict(@conflict, current_user)
          render(json: { message: "Conflict for #{@conflict.user.full_name} updated" })
        else
          Rollbar.info('Conflict could not be updated.', errors: @conflict.errors.full_messages)
          head(422)
        end
      end

      private

      def conflict_params
        params
          .require(:conflict)
          .permit(:user_id, :status_id, :start_date, :end_date, :reason)
          .merge(season_id: current_season['id'])
      end

      def start_param
        DateTime.parse(params[:start]) if params[:start]
        DateTime.parse('2000-01-01')
      end

      def end_param
        DateTime.parse(params[:end]) if params[:end]
        DateTime.parse('2030-01-01')
      end
    end
  end
end
