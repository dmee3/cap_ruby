class UserMailer < ApplicationMailer
  def reset_password_email
    @user = params[:user]

    return if @user.reset_key.blank?

    @url  = "#{reset_url}?key=#{@user.reset_key}"
    mail(to: @user.email, subject: 'Cap City Password Reset')
  end

  private

  def reset_url
    if Rails.env.production?
      'https://members.capcitypercussion.com/reset'
    else
      'http://localhost:3000/reset'
    end
  end
end
