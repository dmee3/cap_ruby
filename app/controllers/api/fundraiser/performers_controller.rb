# frozen_string_literal: true

module Api
  module Fundraiser
    # Read-only, unauthenticated. Feeds the public picker and the date grid.
    class PerformersController < ApiController
      # GET /api/fundraiser/performers
      #
      # Everything the picker needs in ONE request: the old endpoint returned
      # only id/first_name/last_name, so ensemble, section and progress meant a
      # further call per performer.
      def index
        render json: {
          performers: ::Fundraiser::PerformerQuery.call(season_id: season_id),
          total_dates: ::Fundraiser::TOTAL_DATES,
          goal_cents: ::Fundraiser::COMPLETE_DOLLARS * 100
        }
      end

      # GET /api/fundraiser/performers/:token/dates
      #
      # Which of the 31 dates are already sponsored. A GET here writes nothing:
      # the endpoint this replaces called `find_or_create_incomplete_for_user`
      # and so created a fundraiser row every time the picker was opened.
      def dates
        performer = User.find_by(public_token: params[:token])
        return head(:not_found) if performer.blank?

        render json: {
          claimed_dates: ::Fundraiser::ClaimedDatesQuery.call(
            user_id: performer.id, season_id: season_id
          ),
          total_dates: ::Fundraiser::TOTAL_DATES
        }
      end

      private

      def season_id
        ::Fundraiser.public_season&.id
      end
    end
  end
end
