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

  # Only seasons the user is still on can be switched to. Without the
  # membership check the id is just a number in a form post, so someone removed
  # from a season could put themselves back into it by hand.
  def change_season
    requested = params[:season_id]
    if requested.present? && /\A\d+\z/.match(requested) && reachable_season?(requested)
      store_season_cookie(requested)
    else
      store_season_cookie(default_season_id)
    end

    redirect_back fallback_location: root_path
  end

  private

  def store_season_cookie(season_id)
    cookies[:cap_season_id] = season_id
  end

  def reachable_season?(season_id)
    current_user.active_seasons_users.any? { |su| su.season_id.to_s == season_id.to_s }
  end

  def default_season_id
    current_user.active_seasons.order(:year).last&.id
  end

  def handle_unknown_role
    Rollbar.warning(
      'User with unknown role for current season accessed home page.',
      user: current_user,
      season: current_season['id'],
      role: current_user_role
    )

    if default_season_id.present?
      store_season_cookie(default_season_id)
    else
      sign_out current_user
    end

    redirect_to root_path
  end
end
