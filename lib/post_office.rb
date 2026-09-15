# frozen_string_literal: true

class PostOffice
  class << self
    def send_email(recipients, subject, text)
      # Truthiness via DeployEnv, not ENV['STAGING'] == true: the env var is a
      # String, so the old boolean comparison never matched and this prefix had
      # never once fired (cap_ruby-b3a.31).
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

      # Real production only. PostOffice talks to Mailgun directly and so bypasses
      # ActionMailer entirely, which means MailerInterceptor never sees these
      # messages — test mode is the ONLY thing standing between staging and real
      # members' inboxes here, including whistleblower reports (cap_ruby-b3a.31).
      if DeployEnv.real_production?
        @client.disable_test_mode!
      else
        @client.enable_test_mode!
      end
      @client
    end
  end
end
