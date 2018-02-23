# This file is used by Rack-based servers to start the application.

require_relative 'config/environment'
require_relative 'bot/lil_botty'

Thread.abort_on_exception = true

#if Rails.env.production?
  Thread.new do
    LilBotty.run
  end
#end

run Rails.application

