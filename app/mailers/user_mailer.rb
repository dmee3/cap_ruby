# frozen_string_literal: true

class UserMailer < ApplicationMailer
  def reset_password_email
    @user = params[:user]
    ensure_reset_key

    @url = "#{reset_url}?key=#{@user.reset_key}"
    mail(to: @user.email, subject: 'Cap City Password Reset')
  end

  def welcome_email
    @user = params[:user]
    ensure_reset_key

    @url = "#{reset_url}?key=#{@user.reset_key}"
    mail(to: @user.email, subject: 'Welcome to Cap City')
  end

  private

  def ensure_reset_key
    return unless @user.reset_key.blank?

    @user.reset_key = SecureRandom.uuid
    @user.save
  end

  def reset_url
    if Rails.env.production?
      'https://members.capcitypercussion.com/reset'
    else
      'http://localhost:3000/reset'
    end
  end
end
