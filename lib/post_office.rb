class PostOffice
  class << self
    def send_email(to, subject, text)
      client.send_message(
        'mg.capcitypercussion.com',
        from: 'donotreply@mg.capcitypercussion.com',
        to: to,
        subject: subject,
        text: text
      )
    end

    private

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
