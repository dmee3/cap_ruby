# frozen_string_literal: true

module Api
  module Fundraiser
    # Read-only, unauthenticated. Feeds the public picker.
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

      private

      def season_id
        ::Fundraiser.public_season&.id
      end
    end
  end
end
