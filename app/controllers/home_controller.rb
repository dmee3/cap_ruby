# frozen_string_literal: true

class HomeController < ApplicationController
  before_action :authenticate_user!

  def index
    case current_user_role
    when 'admin'
      redirect_to admin_home_path
    when 'member'
      redirect_to members_home_path
    else
      Rollbar.warning('User with unknown role accessed home page.')
      sign_out current_user
    end
  end

  def change_season
    if params[:season_id].present?
      cookies[:cap_season] = Season.find(params[:season_id]).to_json
    else
      cookies[:cap_season] = current_user.seasons.last.to_json
    end

    redirect_back fallback_location: root_path
  end
end
