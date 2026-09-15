# frozen_string_literal: true

# The interceptor exists so development and staging can't email real members:
# it redirects every recipient to EMAIL_DAN. That's pointless in tests, where
# ActionMailer captures deliveries in memory and nothing leaves the process,
# and actively harmful: with EMAIL_DAN unset (CI, or any checkout without a
# .env) it rewrote the recipient to nil and Devise's reset mail raised
# "SMTP To address may not be blank: []".
Rails.application.configure do
  config.action_mailer.interceptors = %w[MailerInterceptor] unless Rails.env.production? || Rails.env.test?
end
