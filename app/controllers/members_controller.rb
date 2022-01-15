# frozen_string_literal: true

class MembersController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_if_not('member') }

  layout 'members'
end
