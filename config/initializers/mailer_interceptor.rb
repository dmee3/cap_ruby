# frozen_string_literal: true

# Initializers run before autoloading.
require_relative '../../lib/deploy_env'

# Skipped in test, where ActionMailer captures deliveries in memory and where
# installing it broke Devise's reset mail with EMAIL_DAN unset (see PR #242).
Rails.application.configure do
  config.action_mailer.interceptors = %w[MailerInterceptor] unless DeployEnv.real_production? || Rails.env.test?
end
