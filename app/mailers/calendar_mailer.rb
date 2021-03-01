class CalendarMailer < ApplicationMailer
  def calendar_email
    @user = User.find(params[:user_id])
    @donation_dates = params[:donation_dates].map { |d| "3/d" }

    if File.exist?(params[:fname])
      File.open(params[:fname]) do |f|
        attachments[params[:fname]] = f.read
      end
      File.delete(params[:fname])
    end

    mail(
      to: @user.email,
      subject: 'Calendar donation received!',
      bcc: ENV['EMAIL_DAN']
    )
  end
end
