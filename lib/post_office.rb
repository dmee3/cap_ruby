# frozen_string_literal: true

class PostOffice
  class << self
    def send_email(recipients, subject, text)
      subject = "[STAGING - ignore] #{subject}" if ENV['STAGING'] == true

      client.send_message(
        domain,
        from: "donotreply@#{domain}",
        to: recipients,
        subject: subject,
        text: text
      )
    end

    private

    def domain
      ENV.fetch('MAILGUN_DOMAIN', nil)
    end

    def client
      @client ||= Mailgun::Client.new(ENV.fetch('MAILGUN_API_KEY', nil))
      if Rails.env.production?
        @client.disable_test_mode!
      else
        @client.enable_test_mode!
      end
      @client
    end
  end
end
