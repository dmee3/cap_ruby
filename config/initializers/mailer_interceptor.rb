unless Rails.env.production?
  ActionMailer::Base.register_interceptor(MailerInterceptor)
end
