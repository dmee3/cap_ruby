# frozen_string_literal: true

class SettingsController < ApplicationController
  before_action :authenticate_user!

  def index
    render_index
  end

  def update
    if current_user.update(email: params[:email], username: params[:username])
      flash[:success] = 'Your settings have been updated!'
      redirect_to(root_url)
    else
      @settings_errors = current_user.errors.full_messages.join('<br />')
      render_index
    end
  end

  def change_password
    unless current_user.valid_password?(params[:old_password])
      @pw_errors = 'Old password was incorrect'
      render_index
      return
    end

    unless params[:new_password] == params[:new_password_confirmation]
      @pw_errors = 'Password confirmation does not match password'
      render_index
      return
    end

    if current_user.update(password: params[:new_password])
      sign_in(current_user, bypass: true)
      flash[:success] = 'Password updated'

      redirect_to(root_url)
    else
      @pw_errors = current_user.errors.full_messages.join('<br />')
      render_index
    end
  end

  private

  def render_index
    case current_user_role
    when 'admin'
      render 'admin/settings/index'
    when 'coordinator'
      render 'coordinators/settings/index'
    when 'staff'
      render 'staff/settings/index'
    else
      render 'members/settings/index'
    end
  end
end
