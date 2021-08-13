class AdminController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_if_not('admin') }
end
