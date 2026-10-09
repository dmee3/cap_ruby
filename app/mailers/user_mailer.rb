# frozen_string_literal: true

class UserMailer < ApplicationMailer
  def welcome_email
    @user = params[:user]
    @membership = @user.seasons_users.active.includes(:season).max_by { |su| su.season.year.to_i }

    # The reset form rather than a tokenised link: a reset token dies after
    # Devise's reset_password_within, and a welcome email can sit unread for
    # longer than that.
    @url = new_user_password_url
    mail(to: @user.email, subject: 'Welcome to Cap City')
  end
end
