# frozen_string_literal: true

module Api
  class AdminController < ApiController
    before_action :authenticate_user!
    before_action -> { redirect_if_not('admin') }
  end
end
