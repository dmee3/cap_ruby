# frozen_string_literal: true

if Rails.env.production?
  require File.join(Rails.root, 'bot/lil_botty')
  SlackRubyBot::Client.logger.level = Logger::WARN
end
