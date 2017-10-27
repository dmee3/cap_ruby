class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  def authorized?
    unless current_user
      logout
      redirect_to '/login'
    end
  end

  def current_user
    token = JsonWebToken.decode cookies[:jwt]
    return User.find(token[:user_id]) if token
  rescue ActiveRecord::RecordNotFound
    nil
  end
  helper_method :current_user

  def logout
    cookies.delete :jwt
    redirect_to root_url
  end

  def redirect_if_not(role)
    redirect_to root_url unless is? role
  end

  def is?(role)
    current_user&.role&.name == role.to_s
  end
  helper_method :is?
end
