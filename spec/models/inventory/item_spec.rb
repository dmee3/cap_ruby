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

    it 'rejects a negative quantity' do
      item = Inventory::Item.new(name: 'Gloves', quantity: -1, inventory_category_id: category.id)
      expect(item).not_to be_valid
      expect(item.errors[:quantity]).to be_present
    end

    # Zero is a real state, not an error: ten items sit there today and the one
    # live email rule fires at exactly 0.
    it 'allows a quantity of zero' do
      item = Inventory::Item.new(name: 'Gloves', quantity: 0, inventory_category_id: category.id)
      expect(item).to be_valid
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

  describe 'soft delete' do
    let!(:item) do
      Inventory::Item.create(name: 'Snare sticks', quantity: 42, inventory_category_id: category.id)
    end

    it 'leaves the stock list but keeps the record' do
      item.destroy
      expect(Inventory::Item.find_by(id: item.id)).to be_nil
      expect(Inventory::Item.with_deleted.find_by(id: item.id)).to eq(item)
    end

    it 'keeps its history, which can still name the item' do
      transaction = Inventory::Transaction.create(
        inventory_item_id: item.id,
        user_id: create(:user).id,
        change: 42,
        previous_quantity: 0,
        performed_on: Date.today
      )
      item.destroy
      expect(transaction.reload.item).to eq(item)
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
        user_id: create(:user).id,
        change: 10,
        previous_quantity: 100,
        performed_on: Date.today
      )
      expect(item.transactions).to include(transaction)
    end
  end
end
