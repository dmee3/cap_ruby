# frozen_string_literal: true

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
require 'rails_helper'

RSpec.describe Inventory::Item, type: :model do
  let(:category) { create(:inventory_category, name: 'Mallets') }

  describe 'validations' do
    it 'requires name and quantity' do
      item = Inventory::Item.new(inventory_category_id: category.id)
      expect(item).not_to be_valid
      expect(item.errors[:name]).to be_present
      expect(item.errors[:quantity]).to be_present
    end

    it 'creates valid item with required fields' do
      item = Inventory::Item.create(
        name: 'Vic Firth M1',
        quantity: 25,
        inventory_category_id: category.id
      )
      expect(item).to be_valid
      expect(item).to be_persisted
    end
  end

  describe 'associations' do
    let(:item) do
      Inventory::Item.create(
        name: 'Promark TX5AW',
        quantity: 100,
        inventory_category_id: category.id
      )
    end

    it 'belongs to category' do
      expect(item.category).to eq(category)
    end

    it 'has many transactions' do
      transaction = Inventory::Transaction.create(
        inventory_item_id: item.id,
        change: 10,
        previous_quantity: 100,
        performed_on: Date.today
      )
      expect(item.transactions).to include(transaction)
    end
  end
end
