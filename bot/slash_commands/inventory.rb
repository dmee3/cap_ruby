# frozen_string_literal: true

SlackRubyBotServer::Events.configure do |config|
  config.on :command, '/inventory' do |command|
    command.logger.info 'Received inventory'
    text = command[:text]
    case text
    when /^check/
      name = text.partition(' ').last
      item = ::Inventory::Item.where('lower(name) = ?', name.downcase).first

      if item.blank?
        suggestions = ::InventoryService.fuzzy_search(name).map(&:name)
        response = <<~TEXT
          *Could not find item "#{name}" - did you check spelling?*

          *Possible suggestions:*
          - #{suggestions.join("\n- ")}
        TEXT
      else
        latest_transaction = item.transactions&.order(:created_at)&.last
        if latest_transaction
          response = <<~TEXT
            *#{item.name}*
            We have #{item.quantity}.
            This item was last updated on #{latest_transaction.created_at.strftime('%a, %b %-d, %Y')}
          TEXT
        else
          response = <<~TEXT
            *#{item.name}*
            We have #{item.quantity}.
          TEXT
        end
      end

      { text: response }
    when /^adjust/
      { text: 'not yet implemented' }
    else
      response = <<~TEXT
        This command is to either check or adjust the quantity of an item in our inventory.

        To check the quantity of an item:
          `/inventory check <item-name>`

        To adjust the quantity of an item:
          `/inventory adjust <item-name> <new-quantity>`
      TEXT
      { text: response }
    end
  end
end
