# frozen_string_literal: true

class SettingsController < ApplicationController
  before_action :authenticate_user!

  def index
    render :index
  end

  def update
    if current_user.update(profile_params)
      flash[:success] = 'Your settings have been updated!'
      redirect_to(settings_path)
    else
      @profile_errors = field_errors(current_user)
      render :index, status: :unprocessable_entity
    end
  end

  def change_password
    @password_errors = password_errors
    return render(:index, status: :unprocessable_entity) if @password_errors.any?

    if current_user.update(password: params[:new_password])
      # It re-signs them in anyway, so bouncing to the dashboard would only
      # lose their place on a page they may have more to do on.
      bypass_sign_in(current_user)
      flash[:success] = 'Password changed. You are still logged in here.'
      redirect_to(settings_path)
    else
      @password_errors = field_errors(current_user, prefix: 'new_password')
      render :index, status: :unprocessable_entity
    end
  end

  private

  def profile_params
    params.permit(:email, :username, :phone)
  end

  # Each operation owns its own errors, so a failed password change leaves the
  # profile section alone rather than both sharing one HTML string joined with
  # line breaks and printed through `raw`.
  def field_errors(user, prefix: nil)
    user.errors.map do |error|
      { field: prefix || error.attribute.to_s, message: error.full_message }
    end
  end

  def password_errors
    if !current_user.valid_password?(params[:old_password])
      [{ field: 'old_password', message: 'That is not your current password' }]
    elsif params[:new_password] != params[:new_password_confirmation]
      [{ field: 'new_password_confirmation', message: "The two new passwords don't match" }]
    else
      []
    end
  end
end
