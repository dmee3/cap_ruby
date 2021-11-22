# frozen_string_literal: true

class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  layout :get_layout

  def current_season
    return nil unless current_user

    cookies[:cap_season] ||= current_user.seasons.last.to_json
    JSON.parse(cookies[:cap_season])
  end
  helper_method :current_season

  def redirect_if_not(role)
    unless current_user_role == role
      respond_to do |format|
        format.html { redirect_to(root_url) }
        format.json { head :unauthorized }
      end
    end
  end

  def current_user_role
    current_user.role_for(current_season['id'])
  end

  def set_stripe_public_key
    if Rails.env.production? && !ENV['STAGING']
      @stripe_public_key = ENV['STRIPE_PUBLIC_KEY']
    else
      @stripe_public_key = ENV['STRIPE_PUBLIC_TEST_KEY']
    end
  end

  def set_stripe_secret_key
    if Rails.env.production? && !ENV['STAGING']
      Stripe.api_key = ENV['STRIPE_SECRET_KEY']
    else
      Stripe.api_key = ENV['STRIPE_SECRET_TEST_KEY']
    end
  end

  private

  def get_layout
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
    else
      nil
    end
  end
end
