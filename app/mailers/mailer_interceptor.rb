# frozen_string_literal: true

class MailerInterceptor
  def self.delivering_email(message)
    return if Rails.env.production?

    message.subject = "[NOT PROD] #{message.subject} | TO #{message.to}"
    message.to = ENV.fetch('EMAIL_DAN', nil)
  end
end
