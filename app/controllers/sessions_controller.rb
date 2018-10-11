class SessionsController < ApplicationController
  def create
    @email_or_username = login_params[:email_or_username].downcase
    user = find_user
    if user&.authenticate(login_params[:password])
      cookies.permanent[:jwt] = JsonWebToken.encode(user_id: user.id)
      ActivityLogger.log_login(user)
      redirect_to root_url
    end

    return if performed?

    flash.now[:error] = 'Invalid username or password'
    render :new
  end

  def new
    @email_or_username = ''
    redirect_to root_url if current_user
  end

  def destroy
    cookies.delete :jwt
    redirect_to '/login'
  end

  private

  def find_user
    user = User.find_by_email(@email_or_username)
    user = User.find_by_username(@email_or_username) if user.nil?
    return user
  end

  def login_params
    params.permit(:email_or_username, :password)
  end
end
