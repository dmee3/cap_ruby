# frozen_string_literal: true

class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  layout :choose_layout

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
    current_user.role_for(current_season['id'])
  end

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

  # rubocop:disable Style/HashLikeCase
  def choose_layout
    return nil unless current_user

    case current_user_role
    when 'admin'
      'admin'
    when 'member'
      'members'
    when 'coordinator'
      'coordinators'
    when 'staff'
      'staff'
    end
  end
  # rubocop:enable Style/HashLikeCase
end
