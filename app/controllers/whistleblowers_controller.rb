class WhistleblowersController < ApplicationController
  def index; end

  def create
    send_email(params[:email], params[:report])
    flash.now[:success] = 'Report submitted.  If you provided contact information, expect a response within the next week.'
    render :index
  rescue StandardError => e
    Rollbar.error(e, user: nil)
    flash.now[:error] = 'Our system has encountered an error.  Please try again.'
    render :index
  end

  private

  def send_email(email, report)
    email = email.present? ? email : '(Anonymous)'
    subject = 'Whistleblower Report'
    text = <<~TEXT
      Whistleblower report submitted at #{Time.now.strftime('%d/%m/%Y %l:%M %P')}.\n\n
      Email: #{email}\n
      Report:\n\n#{report}
    TEXT

    [ENV['EMAIL_AARON'], ENV['EMAIL_DONNIE'], ENV['EMAIL_DAN']].each do |to|
      PostOffice.send_email(to, subject, text)
    end
  end
end
