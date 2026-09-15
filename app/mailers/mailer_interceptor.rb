# frozen_string_literal: true

# Keeps every non-production deploy from emailing real members: recipients are
# redirected to EMAIL_DAN, with the original address kept in the subject.
#
# Installed everywhere except the real production deploy and test
# (see config/initializers/mailer_interceptor.rb). Staging is NOT production
# for this purpose: it runs RAILS_ENV=production with STAGING set and delivers
# through Mailgun for real, so it needs the interceptor most of all.
class MailerInterceptor
  def self.delivering_email(message)
    return if DeployEnv.real_production?

    message.subject = "[NOT PROD] #{message.subject} | TO #{message.to}"

    redirect_to = ENV.fetch('EMAIL_DAN', nil)

    if redirect_to.present?
      message.to = redirect_to
      return
    end

    # No redirect address configured, so there is nowhere safe to send this.
    #
    # On staging that means dropping the delivery: letting it through would
    # reach the real recipient, which is the whole bug this guards against
    # (cap_ruby-b3a.31). Fail closed — unconfigured must never mean "send for
    # real" when the recipient is a real member.
    #
    # Everywhere else, leave the recipient alone: development delivers via
    # :letter_opener and nothing leaves the machine, and blanking the recipient
    # made delivery raise "SMTP To address may not be blank" and the caller
    # look broken.
    message.perform_deliveries = false if DeployEnv.staging?
  end
end
