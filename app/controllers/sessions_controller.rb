class SessionsController < ApplicationController
  def create
    @email = login_params[:email].downcase
    user = User.find_by_email(@email)
    if user&.authenticate(login_params[:password])
      cookies.permanent[:jwt] = JsonWebToken.encode(user_id: user.id)
      log_login(user)
      redirect_to root_url
    end

    return if performed?

    flash.now[:error] = 'Invalid username or password'
    render :new
  end

  def new
    @email = ''
    redirect_to root_url if current_user
  end

  def destroy
    cookies.delete :jwt
    redirect_to '/login'
  end

  private

  def log_login(user)
    log_activity(
      user_id: user.id,
      description: 'Login',
      activity_date: Date.today,
      created_by_id: user.id,
      activity_type: 'login'
    )
  end

  def login_params
    params.permit(:email, :password)
  end
end
