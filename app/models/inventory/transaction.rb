# frozen_string_literal: true

# == Schema Information
#
# Table name: inventory_transactions
#
#  id                :integer          not null, primary key
#  change            :integer
#  performed_on      :date
#  previous_quantity :integer
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  inventory_item_id :bigint
#  user_id           :bigint
#
# Indexes
#
#  index_inventory_transactions_on_inventory_item_id  (inventory_item_id)
#  index_inventory_transactions_on_user_id            (user_id)
#
module Inventory
  class Transaction < ApplicationRecord
    belongs_to :item, class_name: 'Inventory::Item', foreign_key: :inventory_item_id
  end
end
