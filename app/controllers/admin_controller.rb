class AdminController < ApplicationController
  before_action :logout_if_unauthorized
  before_action -> { redirect_if_not('admin') }
end