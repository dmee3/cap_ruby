require_relative 'slash_commands/inventory'
require_relative 'slash_commands/ping'

# Needed for Zeitwerk to not blow up the build
module SlashCommands
  module Inventory; end

  module Ping; end
end
