# frozen_string_literal: true

module Inventory
  # One item's audit trail, plus the frame it's read against: what's on hand now
  # and what the item's alert rule says.
  class ItemHistoryPresenter
    def self.call(item:, manage_alerts: false)
      new(item, manage_alerts).call
    end

    def initialize(item, manage_alerts)
      @item = item
      @manage_alerts = manage_alerts
    end

    def call
      {
        item: {
          id: @item.id,
          category_id: @item.inventory_category_id,
          category_name: @item.category.name,
          name: @item.name,
          quantity: @item.quantity
        },
        alert: alert_json,
        entries: entries,
        can_manage_alerts: @manage_alerts
      }
    end

    private

    def alert_json
      rule = EmailRule.find_by(inventory_item_id: @item.id)
      return nil if rule.nil?

      { id: rule.id, operator: rule.operator, threshold: rule.threshold, user_name: rule.user.full_name }
    end

    def entries
      @item.transactions.includes(:user).newest_first.map do |transaction|
        {
          id: transaction.id,
          change: transaction.change,
          previous_quantity: transaction.previous_quantity,
          performed_on: transaction.performed_on,
          user_name: transaction.user.full_name
        }
      end
    end
  end
end
