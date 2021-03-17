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
end
