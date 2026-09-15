# frozen_string_literal: true

# require_relative, not autoloading: initializers run before the autoloader is
# available, so DeployEnv has to be loaded explicitly here.
require_relative '../../lib/deploy_env'

# The interceptor exists so no deploy other than real production can email real
# members: it redirects every recipient to EMAIL_DAN. Staging counts as "other"
# — it runs RAILS_ENV=production with STAGING set, so gating on
# Rails.env.production? alone left it uninstalled on the one deploy that both
# holds real member data and delivers through Mailgun for real (cap_ruby-b3a.31).
#
# Still skipped in tests, where ActionMailer captures deliveries in memory and
# nothing leaves the process, and where installing it was actively harmful: with
# EMAIL_DAN unset (CI, or any checkout without a .env) it rewrote the recipient
# to nil and Devise's reset mail raised "SMTP To address may not be blank: []".
Rails.application.configure do
  config.action_mailer.interceptors = %w[MailerInterceptor] unless DeployEnv.real_production? || Rails.env.test?
end
