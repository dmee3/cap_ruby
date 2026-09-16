# frozen_string_literal: true

class PostOffice
  class << self
    def send_email(recipients, subject, text)
      subject = "[STAGING - ignore] #{subject}" if DeployEnv.staging?

      email_args = format_email_args(recipients, subject, text)
      client.send_message(
        domain,
        **email_args
      )
    end

    private

    def format_email_args(recipients, subject, text)
      base_args = {
        from: "donotreply@#{domain}",
        subject: subject,
        text: text
      }

      base_args.tap do |args|
        if recipients.is_a?(Array)
          args.merge!(to: recipients.first)

          args.merge!(cc: recipients[1..].join(',')) if recipients.length > 1
        else
          args.merge!(to: recipients)
        end
      end
    end

    def domain
      ENV.fetch('MAILGUN_DOMAIN', nil)
    end

    def client
      @client = Mailgun::Client.new(ENV.fetch('MAILGUN_API_KEY', nil))

      # PostOffice calls Mailgun directly, bypassing ActionMailer and therefore
      # MailerInterceptor, so test mode is the only safeguard on this path.
      if DeployEnv.real_production?
        @client.disable_test_mode!
      else
        @client.enable_test_mode!
      end
      @client
    end
  end
end
