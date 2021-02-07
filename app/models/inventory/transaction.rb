# == Schema Information
#
# Table name: inventory_transactions
#
#  id         :integer          not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :integer
#
# Indexes
#
#  index_inventory_transactions_on_user_id  (user_id)
#
class Inventory::Transaction < ApplicationRecord
  has_and_belongs_to_many :inventory_items, class_name: 'Inventory::Items', join_table: :inventory_items_transactions
end
