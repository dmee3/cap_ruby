# frozen_string_literal: true

ActionMailer::Base.register_interceptor(MailerInterceptor) unless Rails.env.production?
