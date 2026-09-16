# frozen_string_literal: true

# == Schema Information
#
# Table name: inventory_items
#
#  id                    :integer          not null, primary key
#  deleted_at            :datetime
#  name                  :string
#  quantity              :integer
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  inventory_category_id :integer
#
# Indexes
#
#  index_inventory_items_on_deleted_at             (deleted_at)
#  index_inventory_items_on_inventory_category_id  (inventory_category_id)
#
# Foreign Keys
#
#  inventory_category_id  (inventory_category_id => inventory_categories.id)
#
module Inventory
  class Item < ApplicationRecord
    # Soft delete, so removing an item from the shelf doesn't destroy the audit
    # trail of who counted it. Matches Payment / Conflict / User.
    acts_as_paranoid

    validates :name, presence: true
    # A count of things on a shelf has no negative. Zero is a real state — ten
    # items sit there today, and the one live email rule fires at exactly 0.
    validates :quantity, presence: true,
                         numericality: { only_integer: true, greater_than_or_equal_to: 0 }

    belongs_to :category, class_name: 'Inventory::Category',
                          foreign_key: :inventory_category_id
    has_many :transactions, class_name: 'Inventory::Transaction',
                            foreign_key: :inventory_item_id, dependent: nil
    has_many :email_rules, class_name: 'Inventory::EmailRule',
                           foreign_key: :inventory_item_id, dependent: nil
  end
end
