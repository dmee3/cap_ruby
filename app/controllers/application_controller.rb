class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  def authorized?
    logout unless current_user
  end

  def current_user
    return @current if @current
    token = JsonWebToken.decode jwt
    @current = User.find(token[:user_id]) if token
  rescue ActiveRecord::RecordNotFound
    nil
  end
  helper_method :current_user

  def logout
    cookies.delete :jwt
    redirect_to '/login'
  end

  def redirect_if_not(role)
    redirect_to root_url unless current_user&.is?(role)
  end

  private

  def jwt
    if request.xhr?
      params[:jwt]
    else
      cookies[:jwt]
    end
  end
end
