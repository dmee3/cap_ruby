# frozen_string_literal: true

class StaffController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_if_not('staff') }

  layout 'staff'
end
