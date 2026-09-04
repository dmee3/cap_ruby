# frozen_string_literal: true

class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  layout :app_or_auth_layout

  def current_season
    return nil unless current_user

    # Set cookie if it doesn't exist
    cookies[:cap_season_id] = current_user.seasons.last.id if cookies[:cap_season_id].nil?

    Season.find(cookies[:cap_season_id])
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

    current_user.role_for(current_season['id'])
  end
  helper_method :current_user_role

  def set_stripe_public_key
    if Rails.env.production? && !ENV['STAGING']
      @stripe_public_key = ENV.fetch('STRIPE_PUBLIC_KEY', nil)
    else
      @stripe_public_key = ENV.fetch('STRIPE_PUBLIC_TEST_KEY', nil)
    end
  end

  def set_stripe_secret_key
    if Rails.env.production? && !ENV['STAGING']
      Stripe.api_key = ENV.fetch('STRIPE_SECRET_KEY', nil)
    else
      Stripe.api_key = ENV.fetch('STRIPE_SECRET_TEST_KEY', nil)
    end
  end

  private

  # One shell for every authenticated screen; a minimal centered card for
  # Devise (login / password). The `calendar` layout is set explicitly on
  # CalendarsController and is unaffected.
  def app_or_auth_layout
    devise_controller? ? 'auth' : 'application'
  end
end
