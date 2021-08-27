class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  def current_season
    cookies[:cap_season] ||= current_user.seasons.last.to_json
    JSON.parse(cookies[:cap_season])
  end
  helper_method :current_season

  def redirect_if_not(role)
    unless current_user&.is?(role)
      respond_to do |format|
        format.html { redirect_to(root_url) }
        format.json { head :unauthorized }
      end
    end
  end

  def redirect_if_no_inventory_access
    redirect_to(root_url) unless current_user&.is?(:admin) || current_user.quartermaster?
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
end
