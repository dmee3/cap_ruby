class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  def authorized?
    byebug
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
    byebug
    current_user.role.name == role
  end

  private

  def get_user
    token = JsonWebToken.decode cookies[:jwt]
    if token
      return User.find(token[:user_id])
    else
      cookies.delete :jwt
    end
  end
end
