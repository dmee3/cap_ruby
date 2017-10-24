class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  def authorized?
    redirect_to '/login' unless current_user
  end

  def current_user
    return nil if cookies[:jwt].blank?

    token = JsonWebToken.decode cookies[:jwt]
    return User.find(token[:user_id]) if token

    logout
    nil
  rescue ActiveRecord::RecordNotFound
    logout
    nil
  end

  def logout
    cookies.delete :jwt
    redirect_to root_url
  end

  def redirect_if_not(role)
    redirect_to root_url unless is? role
  end

  def is?(role)
    current_user.role.name == role.to_s
  end
end
