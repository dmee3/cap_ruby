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
#  inventory_item_id :integer
#  user_id           :integer
#
# Indexes
#
#  index_inventory_transactions_on_inventory_item_id  (inventory_item_id)
#  index_inventory_transactions_on_user_id            (user_id)
#
module Inventory
  class Transaction < ApplicationRecord
    # with_deleted on both: User and Item are paranoid, and history has to keep
    # naming a departed quartermaster and a deleted item.
    belongs_to :user, -> { with_deleted }
    belongs_to :item, -> { with_deleted }, class_name: 'Inventory::Item',
                                           foreign_key: :inventory_item_id

    scope :newest_first, -> { order(performed_on: :desc, created_at: :desc) }
  end
end
