# frozen_string_literal: true

Rails.application.configure do
  config.action_mailer.interceptors = %w[MailerInterceptor] unless Rails.env.production?
end
