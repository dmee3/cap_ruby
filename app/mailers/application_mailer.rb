# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: 'system@mg.capcitypercussion.com'
  layout 'mailer'
end
