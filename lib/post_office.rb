class PostOffice
  class << self
    def send_email(to, subject, text)
      return unless Rails.env.production?
      client.send_message(
        from: 'donotreply@mg.capcitypercussion.com',
        to: to,
        subject: subject,
        text: text
      )
    end

    private

    def client
      @client ||= Mailgun::Client.new(ENV['MAILGUN_API_KEY'])
    end
  end
end
