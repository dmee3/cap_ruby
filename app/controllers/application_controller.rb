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
    redirect_to root_url unless is? role
  end

  def is?(role)
    current_role == role.to_s
  end
  helper_method :is?

  def log_activity(args)
    Activity.create(
      user_id: args[:user_id],
      description: args[:description],
      activity_date: args[:activity_date],
      created_by_id: args[:created_by_id],
      activity_type: args[:activity_type]
    )
  rescue StandardError => e
    Rollbar.error(e, user: User.find(args[:user_id]))
  end

  private

  def current_role
    @current_role ||= current_user&.role&.name
  end

  def jwt
    if request.xhr?
      params[:jwt]
    else
      cookies[:jwt]
    end
  end
end
