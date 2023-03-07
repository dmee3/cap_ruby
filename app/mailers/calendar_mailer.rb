# frozen_string_literal: true

class CalendarMailer < ApplicationMailer
  def calendar_email
    @user = User.find(params[:user_id])
    @donation_dates = params[:donation_dates].map { |d| "3/#{d}" }
    @donor_name = params[:donor_name]

    mail(
      to: @user.email,
      subject: 'Calendar donation received!',
      bcc: ENV['EMAIL_DAN']
    )
  end

  def download_email
    @user_name = params[:user_name]

    mail(
      to: ENV['EMAIL_DAN'],
      subject: "Calendar downloaded - #{@user_name}",
    )
  end
end
