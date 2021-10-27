# frozen_string_literal: true

module Api
  class ConflictStatusesController < ApiController
    def index
      @conflict_statuses = ConflictStatus.all
      render json: @conflict_statuses
    end
  end
end
