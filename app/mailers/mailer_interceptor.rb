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
    # than blanking it: blanking made delivery raise "SMTP To address may not
    # be blank" and the caller look broken. In the environments this
    # interceptor actually runs in, development uses :letter_opener and test
    # uses :test, so neither sends.
    #
    # NB this guard does NOT cover staging, which runs RAILS_ENV=production
    # with STAGING set and therefore delivers through Mailgun for real. See
    # cap_ruby-b3a.31.
    redirect_to = ENV.fetch('EMAIL_DAN', nil)
    message.to = redirect_to if redirect_to.present?
  end
end
