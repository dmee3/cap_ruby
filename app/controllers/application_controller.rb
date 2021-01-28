class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  def logout_if_unauthorized
    logout unless current_user
  end

  def logged_in?
    return true if current_user
    false
  end
  helper_method :logged_in?

  def current_user
    return @current if @current
    token = JsonWebToken.decode(jwt)
    @current = User.find(token[:user_id]) if token
  rescue ActiveRecord::RecordNotFound
    nil
  end
  helper_method :current_user

  def current_season
    cookies[:cap_season] ||= current_user.seasons.last.to_json
    JSON.parse(cookies[:cap_season])
  end
  helper_method :current_season

  def logout
    cookies.delete :jwt
    redirect_to '/login'
  end

  def redirect_if_not(role)
    redirect_to(root_url) unless current_user&.is?(role)
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

  def jwt
    request.xhr? ? params[:jwt] : cookies[:jwt]
  end
end
