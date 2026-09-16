# frozen_string_literal: true

module Inventory
  # The whole stock list in one payload: categories with their items, each
  # item's alert rule, and the counts the header summarises.
  #
  # "Low" is not a universal number — it is the item's own alert rule, printed
  # next to the count so the threshold is visible where you act on it. An item
  # with no rule can never be low, only out.
  class StockListPresenter
    def self.call(manage_alerts: false)
      new(manage_alerts: manage_alerts).call
    end

    def initialize(manage_alerts: false)
      @manage_alerts = manage_alerts
    end

    def call
      {
        # Empty categories sort last so they never sit between two stocked ones.
        categories: categories.map { |category| category_json(category) }
                              .sort_by { |json| [json[:item_count].zero? ? 1 : 0, json[:name].to_s.downcase] },
        stats: stats,
        last_change: last_change,
        can_manage_alerts: @manage_alerts
      }
    end

    private

    def categories
      @categories ||= Category.includes(:items).order(:name)
    end

    def items
      @items ||= categories.flat_map(&:items)
    end

    def rules_by_item
      @rules_by_item ||= EmailRule.all.index_by(&:inventory_item_id)
    end

    def category_json(category)
      sorted = category.items.sort_by { |item| item.name.to_s.downcase }
      {
        id: category.id,
        name: category.name,
        item_count: sorted.length,
        items: sorted.map { |item| item_json(item) }
      }
    end

    def item_json(item)
      rule = rules_by_item[item.id]
      {
        id: item.id,
        category_id: item.inventory_category_id,
        name: item.name,
        quantity: item.quantity,
        status: status_for(item, rule),
        alert: rule && {
          id: rule.id,
          operator: rule.operator,
          threshold: rule.threshold
        }
      }
    end

    # Out beats low: an item at zero needs attention whether or not anyone
    # wrote a rule for it.
    def status_for(item, rule)
      return 'out' if item.quantity.to_i.zero?
      return 'low' if rule&.applies_to?(item.quantity)

      'ok'
    end

    def stats
      statuses = items.map { |item| status_for(item, rules_by_item[item.id]) }
      {
        tracked: items.length,
        under_alert: statuses.count('low'),
        out_of_stock: statuses.count('out'),
        no_alert: items.count { |item| rules_by_item[item.id].nil? }
      }
    end

    def last_change
      transaction = Transaction.includes(:user).newest_first.first
      return nil if transaction.nil?

      {
        performed_on: transaction.performed_on,
        user_name: transaction.user.full_name
      }
    end
  end
end
