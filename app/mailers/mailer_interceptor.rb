# frozen_string_literal: true

# Keeps development and staging from emailing real members: every recipient is
# redirected to EMAIL_DAN, with the original address kept in the subject.
#
# Not installed in test or production (see config/initializers/mailer_interceptor.rb).
class MailerInterceptor
  def self.delivering_email(message)
    return if Rails.env.production?

    message.subject = "[NOT PROD] #{message.subject} | TO #{message.to}"

    # With no redirect address configured, leave the recipient alone rather
    # than blanking it: delivery would raise "SMTP To address may not be
    # blank" and the caller would look broken. Nothing outside production
    # delivers for real anyway.
    redirect_to = ENV.fetch('EMAIL_DAN', nil)
    message.to = redirect_to if redirect_to.present?
  end
end
