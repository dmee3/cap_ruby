# frozen_string_literal: true

module Api
  module Admin
    class SeasonsController < Api::AdminController
      def index
        @seasons = Season.all.order(:year)
        render json: @seasons
      end
    end
  end
end
