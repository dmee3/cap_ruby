class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  def authorized?
    redirect_to '/login' unless current_user
  end

  def current_user
    return nil if cookies[:jwt].blank?
    @curr ||= get_user
  end

  def redirect_if_not(role)
    redirect_to root_url unless is? role
  end

  def is?(role)
    current_user.role.name == role
  end

  private

  def get_user
    token = JsonWebToken.decode cookies[:jwt]
    return User.find(token[:user_id]) if token
    cookies.delete :jwt
  end
end
