# frozen_string_literal: true

class PostOffice
  class << self
    def send_email(recipients, subject, text)
      subject = "[STAGING - ignore] #{subject}" if ENV['STAGING'] == true

      to = ""
      cc = []
      if recipients.is_a?(String)
        to = recipients
      else
        to, *cc = recipients
      end

      client.send_message(
        domain,
        from: "donotreply@#{domain}",
        to: recipients,
        cc: cc,
        subject: subject,
        text: text
      )
    end

    private

    def domain
      ENV['MAILGUN_DOMAIN']
    end

    def client
      @client ||= Mailgun::Client.new(ENV['MAILGUN_API_KEY'])
      if Rails.env.production?
        @client.disable_test_mode!
      else
        @client.enable_test_mode!
      end
      @client
    end
  end
end
