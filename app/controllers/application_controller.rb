# frozen_string_literal: true

class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  layout :app_or_auth_layout

  # The season the app is currently showing. Only ever one the user is still on:
  # a cookie left pointing at a season they were removed from (or that no longer
  # exists) is replaced with their most recent one, so being removed mid-session
  # lands them somewhere real instead of on a season whose every page bounces.
  def current_season
    return nil unless current_user

    reachable = current_user.active_seasons.order(:year)
    return nil if reachable.empty?

    cookie_id = cookies[:cap_season_id]
    season = reachable.find { |s| s.id.to_s == cookie_id.to_s } if cookie_id.present?
    season ||= reachable.last
    cookies[:cap_season_id] = season.id unless cookie_id.to_s == season.id.to_s

    season
  end
  helper_method :current_season

  def redirect_if_not(*roles)
    return if Array.wrap(roles).include?(current_user_role)

    respond_to do |format|
      format.html { redirect_to(root_url) }
      format.json { head :unauthorized }
    end
  end

  def current_user_role
    return nil unless current_user

    season = current_season
    return nil if season.nil?

    current_user.role_for(season['id'])
  end
  helper_method :current_user_role

  def set_stripe_public_key
    if DeployEnv.real_production?
      @stripe_public_key = ENV.fetch('STRIPE_PUBLIC_KEY', nil)
    else
      @stripe_public_key = ENV.fetch('STRIPE_PUBLIC_TEST_KEY', nil)
    end
  end

  def set_stripe_secret_key
    if DeployEnv.real_production?
      Stripe.api_key = ENV.fetch('STRIPE_SECRET_KEY', nil)
    else
      Stripe.api_key = ENV.fetch('STRIPE_SECRET_TEST_KEY', nil)
    end
  end

  private

  # The app shell for every authenticated screen; a minimal centered card for
  # Devise (login / password). Public, unauthenticated routes opt out by
  # inheriting from PublicController (layout 'public'), which bypasses this
  # method entirely. Those three are the whole layout set — Flow 7 folded away
  # the last per-controller `layout` call (the fundraiser's one-off 'calendar').
  def app_or_auth_layout
    devise_controller? ? 'auth' : 'application'
  end
end
