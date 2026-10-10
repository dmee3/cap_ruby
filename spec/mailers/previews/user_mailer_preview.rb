# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/user_mailer
class UserMailerPreview < ActionMailer::Preview
  def welcome_email
    UserMailer.with(user: SeasonsUser.active.where(role: 'member').last&.user || User.last).welcome_email
  end
end
