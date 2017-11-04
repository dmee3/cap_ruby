class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  def authorized?
    logout unless current_user
  end

  def current_user
    token = JsonWebToken.decode jwt
    return User.find(token[:user_id]) if token
  rescue ActiveRecord::RecordNotFound
    nil
  end
  helper_method :current_user

  def logout
    cookies.delete :jwt
    redirect_to '/login'
  end

  def redirect_if_not(role)
    redirect_to root_url unless is? role
  end

  def is?(role)
    current_user&.is? role.to_s
  end
  helper_method :is?

  private

  def jwt
    if request.xhr?
      params[:jwt]
    else
      cookies[:jwt]
    end
  end
end
