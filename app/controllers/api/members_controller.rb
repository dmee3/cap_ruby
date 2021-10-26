# frozen_string_literal: true

module Api
  class MembersController < ApiController
    before_action :authenticate_user!
    before_action -> { redirect_if_not('member') }
  end
end
