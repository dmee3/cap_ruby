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
        response = SlashCommands::Inventory.suggestion_text(name)
      else
        response = SlashCommands::Inventory.check_success_text(item)
      end

    when /^adjust/
      name = text.split[1...-1].join(' ')
      item = ::Inventory::Item.where('lower(name) = ?', name.downcase).first

      if item.blank?
        response = SlashCommands::Inventory.suggestion_text(name)
      else
        new_qty_str = text.split.last
        begin
          new_qty = Integer(new_qty_str)
          old_qty = item.quantity
          SlashCommands::Inventory.save_item_adjustment(item, old_qty, new_qty)

          response = <<~TEXT
            *#{item.name}*
            Inventory adjusted from #{old_qty} to #{new_qty}.
          TEXT
        rescue ArgumentError
          response = "Invalid quantity \"#{new_qty_str}\""
        end
      end

    else
      response = <<~TEXT
        This command is to either check or adjust the quantity of an item in our inventory.

        To check the quantity of an item:
          `/inventory check <item-name>`

        To adjust the quantity of an item:
          `/inventory adjust <item-name> <new-quantity>`
      TEXT
    end

    { text: response }
  end
end

module SlashCommands
  class Inventory
    def self.check_success_text(item)
      latest_transaction = item.transactions&.order(:created_at)&.last
      if latest_transaction
        <<~TEXT
          *#{item.name}*
          We have #{item.quantity}.
          This item was last updated on #{latest_transaction.created_at.strftime('%a, %b %-d, %Y')}
        TEXT
      else
        <<~TEXT
          *#{item.name}*
          We have #{item.quantity}.
        TEXT
      end
    end

    def self.suggestion_text(name)
      suggestions = ::InventoryService.fuzzy_search(name).map(&:name)
      <<~TEXT
        *Could not find item "#{name}" - did you check spelling?*

        *Possible suggestions:*
        - #{suggestions.join("\n- ")}
      TEXT
    end

    def self.save_item_adjustment(item, old_qty, new_qty)
      item.update(quantity: new_qty)
      if item.quantity != old_qty
        ::Inventory::Transaction.create(
          change: item.quantity - old_qty,
          performed_on: Date.today,
          previous_quantity: old_qty,
          inventory_item_id: item.id,
          user_id: 1
        )
      end

      rules = ::Inventory::EmailRule.where(inventory_item_id: item.id)
      rules.each { |rule| rule.notify_if_applicable(item.quantity) }
    end
  end
end
