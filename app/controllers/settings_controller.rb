class SettingsController < ApplicationController
  before_action :logout_if_unauthorized, only: [:index, :update, :change_password]
  before_action :ensure_key_param, only: [:reset_password, :complete_reset]

  def index
    render_index
  end

  def update
    if current_user.update(email: params[:email], username: params[:username])
      flash[:success] = 'Your settings have been updated!'
      redirect_to(root_url)
    else
      @settings_errors = current_user.errors.full_messages.join("<br />")
      render_index
    end
  end

  def change_password
    unless current_user.authenticate(params[:old_password])
      @pw_errors = 'Old password was incorrect'
      render_index
      return
    end

    if current_user.update(password: params[:new_password], password_confirmation: params[:new_password_confirmation])
      flash[:success] = 'Password updated'
      redirect_to(root_url)
    else
      @pw_errors = current_user.errors.full_messages.join("<br />")
      render_index
    end
  end

  def forgot_password
    render :forgot
  end

  def initiate_reset
    @user = User.find_by(email: params[:email])

    @user.initiate_password_reset if @user

    # Even if we didn't find a user, tell them to check their email to prevent
    # people from finding out user emails
    render :initiated
  end

  def reset_password
    render :reset
  end

  def complete_reset
    @user = User.find_by(reset_key: @key)

    if @user.blank?
      redirect_to(root_url)
      return
    end

    if @user.update(password: params[:password], password_confirmation: params[:password_confirmation])
      ActivityLogger.log_pw_reset_completed(@user)
      flash[:success] = 'Your password has been reset!'
      redirect_to(root_url)
    else
      @errors = @user.errors.full_messages.join("<br />")
      render :reset
    end
  end

  private

  def render_index
    if current_user.is?(:admin)
      render 'admin/settings/index'
    else
      render 'members/settings/index'
    end
  end

  def ensure_key_param
    redirect_to root_url if params[:key].blank?
    @key = params[:key]
  end
end