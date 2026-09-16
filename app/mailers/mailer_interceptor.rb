# frozen_string_literal: true

# Redirects every recipient to EMAIL_DAN so non-production deploys can't email
# real members. Installed everywhere except real production and test
# (see config/initializers/mailer_interceptor.rb).
class MailerInterceptor
  def self.delivering_email(message)
    return if DeployEnv.real_production?

    message.subject = "[NOT PROD] #{message.subject} | TO #{message.to}"

    redirect_to = ENV.fetch('EMAIL_DAN', nil)

    if redirect_to.present?
      message.to = redirect_to
      return
    end

    # Nowhere safe to redirect to. Staging delivers through Mailgun for real, so
    # drop it; elsewhere :letter_opener means nothing leaves the machine, and
    # blanking the recipient raises "SMTP To address may not be blank".
    message.perform_deliveries = false if DeployEnv.staging?
  end
end
