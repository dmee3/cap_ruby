# frozen_string_literal: true

class InventoryService
  class << self
    def fuzzy_search(query, results = 5)
      items = Inventory::Item.all
      scores = items.map { |i| [i, JaroWinkler.distance(i.name, query, ignore_case: true)] }
      scores.sort_by { |s| s[1] }.reverse.map { |s| s[0] }.take(results)
    end
  end
end
