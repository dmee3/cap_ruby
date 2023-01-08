require_relative 'slash_commands/inventory'
require_relative 'slash_commands/ping'

# Needed for Zeitwerk to not blow up the build
module SlashCommands
  module Ping; end
end
