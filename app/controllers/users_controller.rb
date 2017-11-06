class UsersController < ApplicationController
  before_action :authorized?
  before_action -> { redirect_if_not 'admin' }, except: %i[settings change_settings]

  def index
    @members = User.where(role: Role.find_by_name('member')).includes(:payment_schedule).order :first_name
    @staff = User.where(role: Role.find_by_name('staff')).order :first_name
    @admin = User.where(role: Role.find_by_name('admin')).order :first_name
    render
  end

  def new
    @user = User.new
    @roles = Role.all.reverse_order
  end

  def create
    @user = User.new user_params
    if @user.save
      DefaultPaymentSchedule.create @user.id if @user.is? 'member'
      flash[:success] = "#{@user.first_name} account created"
      redirect_to users_path
    else
      @roles = Role.all.reverse_order
      flash.now[:error] = @user.errors.full_messages.to_sentence
      render :new
    end
  end

  def edit
    @user = User.find params[:id]
    @roles = Role.all
  end

  def update
    @user = User.find params[:id]
    if @user.update(user_params.reject { |_k, v| v.blank? })
      flash[:success] = "#{@user.first_name} updated"
    else
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

  def change_settings
    unless current_user.authenticate settings_params[:old_password]
      flash.now[:error] = 'Old password was incorrect, please try again'
      render :settings
    end

    unless settings_params[:new_password] == settings_params[:new_password_confirmation]
      flash.now[:error] = "New passwords don\'t match, please try again"
      render :settings
    end

    return if performed?

    if current_user.update password: settings_params[:new_password]
      flash[:success] = 'Password updated'
    else
      flash[:error] = 'Error saving new password, please try again or contact a director'
    end

    redirect_to root_url
  end

  private

  def user_params
    params.require(:user).permit :first_name, :last_name, :email, :password,
                                 :password_confirmation, :role_id
  end

  def settings_params
    params.permit :old_password, :new_password, :new_password_confirmation
  end
end
