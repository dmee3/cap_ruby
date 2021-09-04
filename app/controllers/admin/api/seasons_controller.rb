# frozen_string_literal: true

module Admin
  module Api
    class SeasonsController < ApiController
      def index
        @seasons = Season.all.order(:year)
        render json: @seasons
      end
    end
  end
end
