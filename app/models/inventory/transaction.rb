class Inventory::Transaction < ApplicationRecord
  has_and_belongs_to_many :inventory_items, class_name: 'Inventory::Items'
end
