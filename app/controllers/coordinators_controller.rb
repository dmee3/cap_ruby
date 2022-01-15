# frozen_string_literal: true

class CoordinatorsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_if_not('coordinator') }

  layout 'coordinators'
end
