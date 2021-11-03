# frozen_string_literal: true

class UserMailer < ApplicationMailer
  def welcome_email
    @user = params[:user]

    @url = new_user_password_path
    mail(to: @user.email, subject: 'Welcome to Cap City')
  end
end
