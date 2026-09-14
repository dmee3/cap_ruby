# frozen_string_literal: true

module Api
  module Admin
    class ScheduleForecastsController < Api::AdminController
      # Creates nothing. `no_default` is a real, reachable answer rather than an
      # error: DEFAULT_PAYMENT_SCHEDULES stops at 2026 and the 2027 season
      # already has members.
      def show
        season = Season.find_by(id: params[:season_id])
        forecast = ::Admin::ScheduleForecast.call(
          season: season,
          ensemble: params[:ensemble],
          section: params[:section],
          vet: ActiveModel::Type::Boolean.new.cast(params[:vet])
        )

        if forecast.nil?
          render json: { no_default: true }
        else
          render json: forecast
        end
      end
    end
  end
end
