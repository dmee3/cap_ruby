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
require 'rails_helper'

RSpec.describe Inventory::Transaction, type: :model do
  let(:user) { create(:user) }
  let(:category) { create(:inventory_category) }
  let(:item) { Inventory::Item.create(name: 'Drumsticks', quantity: 100, inventory_category_id: category.id) }

  describe 'associations' do
    let(:transaction) do
      Inventory::Transaction.create(
        inventory_item_id: item.id,
        user_id: user.id,
        change: -10,
        previous_quantity: 100,
        performed_on: Date.today
      )
    end

    it 'belongs to item' do
      expect(transaction.item).to eq(item)
    end

    it 'belongs to the user who made the change' do
      expect(transaction.user).to eq(user)
    end

    it 'requires a user' do
      orphan = Inventory::Transaction.new(
        inventory_item_id: item.id,
        change: -10,
        previous_quantity: 100,
        performed_on: Date.today
      )
      expect(orphan).not_to be_valid
    end

    # User is paranoid, so without `with_deleted` a departed quartermaster's
    # counts would render unattributed — the one thing history exists to show.
    it 'still names a user who has since been deleted' do
      transaction
      user.destroy
      expect(transaction.reload.user).to eq(user)
    end
  end

  describe 'tracking changes' do
    it 'records quantity increases' do
      transaction = Inventory::Transaction.create(
        inventory_item_id: item.id,
        user_id: user.id,
        change: 25,
        previous_quantity: 100,
        performed_on: Date.today
      )
      expect(transaction.change).to eq(25)
      expect(transaction.previous_quantity).to eq(100)
    end

    it 'records quantity decreases' do
      transaction = Inventory::Transaction.create(
        inventory_item_id: item.id,
        user_id: user.id,
        change: -15,
        previous_quantity: 100,
        performed_on: Date.today
      )
      expect(transaction.change).to eq(-15)
    end

    it 'stores performed_on date' do
      transaction = Inventory::Transaction.create(
        inventory_item_id: item.id,
        user_id: user.id,
        change: 5,
        previous_quantity: 100,
        performed_on: Date.new(2026, 1, 15)
      )
      expect(transaction.performed_on).to eq(Date.new(2026, 1, 15))
    end
  end
end
