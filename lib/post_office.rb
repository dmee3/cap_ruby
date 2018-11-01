class PostOffice
  class << self
    def send_email(to, subject, text)
      subject = "[STAGING - ignore] #{subject}" if ENV['STAGING'] == true

      client.send_message(
        domain,
        from: "donotreply@#{domain}",
        to: to,
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
