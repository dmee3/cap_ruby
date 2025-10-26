# frozen_string_literal: true

class HomeController < ApplicationController
  before_action :authenticate_user!

  def index
    case current_user_role
    when 'admin'
      redirect_to admin_home_path
    when 'member'
      redirect_to members_home_path
    when 'coordinator'
      redirect_to coordinators_home_path
    when 'staff'
      redirect_to staff_home_path
    else
      handle_unknown_role
    end
  end

  def change_season
    if params[:season_id].present? && /\A\d+\z/.match(params[:season_id])
      store_season_cookie(params[:season_id])
    else
      store_season_cookie(current_user.seasons.last.id)
    end

    redirect_back fallback_location: root_path
  end

  private

  def store_season_cookie(season_id)
    cookies[:cap_season_id] = season_id
  end

  def handle_unknown_role
    Rollbar.warning(
      'User with unknown role for current season accessed home page.',
      user: current_user,
      season: current_season['id'],
      role: current_user_role
    )

    if current_user.seasons_users.any?
      store_season_cookie(current_user.seasons.last.id)
    else
      sign_out current_user
    end

    redirect_to root_path
  end
end
