class UsersController < ApplicationController
  before_action :authorized?
  before_action -> { redirect_if_not 'admin' }

  def index
    respond_to do |format|
      format.html
      format.json { render json: User.all }
    end
  end

  def new
    @user = User.new
    @roles = Role.all
  end

  def create
    user_params[:password_confirmation] = user_params[:password]
    @user = User.new user_params
    if @user.save
      flash[:success] = "#{@user.first_name} account created"
      redirect_to users_path
    else
      # TODO: Fix error handling here and in the view
      flash[:error] = "#{@user.first_name} account not created"
      render :new
    end
  end

  def edit
    @user = User.find params[:id]
    @roles = Role.all
  end

  def update
    @user = User.find params[:id]
    user_params[:password_confirmation] = user_params[:password]
    if @user.update user_params
      flash[:success] = "#{@user.first_name} updated"
      redirect_to users_path
    else
      flash[:error] = "Unable to update #{@user.first_name}"
    end
  end

  def destroy
    @user = User.find params[:id]
    if user
      @user.destroy
      flash[:success] = "#{@user.first_name} deleted"
      redirect_to users_path
    else
      flash[:error] = "Unable to delete #{@user.first_name}"
    end
  end

  private

  def user_params
    params.require(:user).permit :first_name, :last_name, :email, :password,
                                 :password_confirmation, :role_id
  end
end
