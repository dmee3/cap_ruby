# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Inventory::Transaction, type: :model do
  let(:category) { create(:inventory_category) }
  let(:item) { Inventory::Item.create(name: 'Drumsticks', quantity: 100, inventory_category_id: category.id) }

  describe 'associations' do
    let(:transaction) do
      Inventory::Transaction.create(
        inventory_item_id: item.id,
        change: -10,
        previous_quantity: 100,
        performed_on: Date.today
      )
    end

    it 'belongs to item' do
      expect(transaction.item).to eq(item)
    end
  end

  describe 'tracking changes' do
    it 'records quantity increases' do
      transaction = Inventory::Transaction.create(
        inventory_item_id: item.id,
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
        change: -15,
        previous_quantity: 100,
        performed_on: Date.today
      )
      expect(transaction.change).to eq(-15)
    end

    it 'stores performed_on date' do
      transaction = Inventory::Transaction.create(
        inventory_item_id: item.id,
        change: 5,
        previous_quantity: 100,
        performed_on: Date.new(2026, 1, 15)
      )
      expect(transaction.performed_on).to eq(Date.new(2026, 1, 15))
    end
  end
end
