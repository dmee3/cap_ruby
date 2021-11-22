# frozen_string_literal: true

module Api
  class CoordinatorsController < ApiController
    before_action :authenticate_user!
    before_action -> { redirect_if_not('coordinator') }
  end
end
