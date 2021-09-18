# frozen_string_literal: true

module Api
  module Admin
    class ConflictsController < Api::AdminController
      def index
        @conflicts = Conflict
                     .for_season(current_season['id'])
                     .where('start_date > ?', start_param)
                     .where('end_date < ?', end_param)
                     .order(:start_date)

        @conflicts = @conflicts.map do |c|
          {
            id: c.id,
            title: c.user.full_name,
            start: c.start_date,
            end: c.end_date,
            reason: c.reason,
            status: c.status,
            created_at: c.created_at
          }
        end
        render json: @conflicts
      end

      private

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
