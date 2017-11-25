class SessionsController < ApplicationController
  def create
    user = User.find_by_email(login_params[:email].downcase)
    if user&.authenticate(login_params[:password])
      cookies.permanent[:jwt] = JsonWebToken.encode(user_id: user.id)
      log_activity(user, 'login')
      redirect_to root_url
    end

    return if performed?

    flash.now[:error] = 'Invalid username or password'
    render :new
  end

  def new
    redirect_to root_url if current_user
  end

  def destroy
    cookies.delete :jwt
    redirect_to '/login'
  end

  private

  def login_params
    params.permit(:email, :password)
  end
end
