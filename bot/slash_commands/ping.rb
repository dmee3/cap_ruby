# frozen_string_literal: true

SlackRubyBotServer::Events.configure do |config|
  config.on :command, '/ping' do |command|
    command.logger.info 'Received a ping, responding with pong.'
    { text: 'pong' }
  end
end

module SlashCommands
  module Ping; end
end
