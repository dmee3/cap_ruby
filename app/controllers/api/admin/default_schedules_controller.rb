# frozen_string_literal: true

module Api
  module Admin
    # Writes to the current season's default payment schedules. None of these
    # touch a member's schedule except apply_to_empty, which only fills
    # schedules with no entries.
    class DefaultSchedulesController < Api::AdminController
      def copy
        result = DefaultSchedules::Copy.call(
          source: Season.find_by(id: params[:source_season_id]),
          target: current_season,
          shift_weeks: Integer(params[:shift_weeks].to_s, exception: false)
        )
        return render(json: { error: result.error }, status: 422) unless result.ok?

        render json: { created: result.created }
      end

      def update
        combination = DefaultSchedules::Combination.from_slug(params[:combination])
        return head(404) if combination.nil?

        result = DefaultSchedules::Save.call(
          season: current_season, combination: combination, entries: entry_params
        )
        return render(json: { errors: result.errors }, status: 422) unless result.ok?

        combinations = DefaultSchedules::Overview.call(current_season)[:combinations]
        render json: combinations.find { |c| c[:slug] == combination.slug }
      end

      def move_dates
        moves = Array.wrap(params[:moves]).to_h do |move|
          [Date.iso8601(move[:from].to_s), Date.iso8601(move[:to].to_s)]
        end
        result = DefaultSchedules::MoveDates.call(season: current_season, moves: moves)
        return render(json: { error: result.error }, status: 422) unless result.ok?

        render json: { moved: result.moved }
      rescue Date::Error
        render json: { error: 'Every date needs to be a real date.' }, status: 422
      end

      def apply_to_empty
        result = DefaultSchedules::ApplyToEmpty.call(current_season)
        render json: { filled: result.filled, still_empty: result.still_empty }
      end

      private

      def entry_params
        Array.wrap(params[:entries]).map { |e| e.permit(:pay_date, :amount_cents).to_h.symbolize_keys }
      end
    end
  end
end
