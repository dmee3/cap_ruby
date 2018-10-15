class UsersController < ApplicationController
  before_action :authorized?
  before_action -> { redirect_if_not 'admin' }, except: %i[settings change_password update_settings]

  def index
    order_key = User.column_names.include?(params[:order]) ? params[:order] : :first_name
    @columns = [ ['First', :first_name], ['Last', :last_name], ['Section', :section] ]
    @members = User.for_season(current_season['id']).with_role(:member).includes(:payment_schedules).order(order_key)
    @staff = User.for_season(current_season['id']).with_role(:staff)
    @admins = User.for_season(current_season['id']).with_role(:admin)
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      flash[:success] = "#{@user.first_name} account created"
      redirect_to(users_path)
    else
      Rollbar.info('User could not be created.', errors: @user.errors.full_messages)
      flash.now[:error] = @user.errors.full_messages.to_sentence
      render :new
    end
  end

  def edit
    @user = User.find(params[:id])
  end

  def update
    @user = User.find(params[:id])
    if @user.update(user_params.reject { |_k, v| v.blank? }) # only update non-empty fields
      flash[:success] = "#{@user.first_name} updated"
    else
      Rollbar.info('User could not be updated.', errors: @user.errors.full_messages)
      flash[:error] = "Unable to update #{@user.first_name}"
    end

    redirect_to users_path
  end

  def destroy
    @user = User.find params[:id]
    if @user.destroy
      flash[:success] = "#{@user.first_name} deleted"
      redirect_to users_path
    else
      flash[:error] = "Unable to delete #{@user.first_name}"
    end
  end

  def settings; end

  def change_password
    unless current_user.authenticate(params[:old_password])
      flash.now[:error] = 'Old password was incorrect, please try again'
      render :settings
    end

    unless params[:new_password] == params[:new_password_confirmation]
      flash.now[:error] = "New passwords don\'t match, please try again"
      render :settings
    end

    return if performed?

    if current_user.update(password: params[:new_password])
      flash[:success] = 'Password updated'
    else
      flash[:error] = 'Error saving new password, please try again or contact a director'
    end

    redirect_to root_url
  end

  def update_settings
    if current_user.update(email: params[:email], username: params[:username])
      flash[:success] = 'Settings updated'
      redirect_to root_url
    else
      flash.now[:error] = "Couldn't update settings, please make sure your username and email are unique"
      render :settings
    end
  end

  private

  def user_params
    params.require(:user).permit(
      :first_name,
      :last_name,
      :email,
      :password,
      :password_confirmation,
      :role_id,
      :section,
      :username,
      season_ids:[]
    )
  end
end
