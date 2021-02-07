# == Schema Information
#
# Table name: inventory_items
#
#  id                    :integer          not null, primary key
#  name                  :string
#  quantity              :integer
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  inventory_category_id :integer
#
# Indexes
#
#  index_inventory_items_on_inventory_category_id  (inventory_category_id)
#
# Foreign Keys
#
#  inventory_category_id  (inventory_category_id => inventory_categories.id)
#
class Inventory::Item < ApplicationRecord
  validates :name, :quantity, presence: true

  belongs_to :inventory_category, class_name: 'Inventory::Category', foreign_key: :inventory_category_id
  has_many :transactions, class_name: 'Inventory::Transaction', foreign_key: :inventory_item_id
end
