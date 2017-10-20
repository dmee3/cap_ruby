class SessionsController < ApplicationController
  def create
    user = User.find_by_email login_params[:email]
    if user && user.authenticate(login_params[:password])
      cookies.permanent[:jwt] = JsonWebToken.encode(user_id: user.id)
      redirect_for_role user
      return
    end

    flash[:error] = 'Invalid username or password'
    render :new
  end

  def new
    redirect_for_role(current_user) if current_user
  end

  def destroy
    cookies.delete :jwt
    redirect_to '/login'
  end

  private

  def redirect_for_role(user)
    redirect_to root_url
  end

  def login_params
    params.permit(:email, :password)
  end
end
