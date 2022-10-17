# frozen_string_literal: true

require_relative '../../app/mailers/mailer_interceptor'

ActionMailer::Base.register_interceptor(MailerInterceptor) unless Rails.env.production?
