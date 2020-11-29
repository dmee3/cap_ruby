class Inventory::Category < ApplicationRecord
  validates :name, presence: true
end
