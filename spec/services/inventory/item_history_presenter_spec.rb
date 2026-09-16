# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Inventory::ItemHistoryPresenter do
  let(:counter) { create(:user) }
  let(:category) { create(:inventory_category, name: 'Sticks') }
  let(:item) do
    Inventory::Item.create!(name: 'Snare sticks', quantity: 42, inventory_category_id: category.id)
  end

  def transaction(change, previous, on)
    Inventory::Transaction.create!(
      inventory_item_id: item.id, user_id: counter.id,
      change: change, previous_quantity: previous, performed_on: on
    )
  end

  it 'frames the trail with the item and its category' do
    result = described_class.call(item: item)

    expect(result[:item]).to include(name: 'Snare sticks', quantity: 42, category_name: 'Sticks')
  end

  it 'names whoever made each change' do
    transaction(24, 0, Date.new(2026, 2, 14))

    expect(described_class.call(item: item)[:entries].first).to include(
      change: 24, previous_quantity: 0, user_name: counter.full_name
    )
  end

  it 'puts the newest change first' do
    transaction(24, 0, Date.new(2026, 2, 14))
    transaction(-6, 24, Date.new(2026, 3, 3))

    expect(described_class.call(item: item)[:entries].map { |e| e[:change] }).to eq([-6, 24])
  end

  it 'is empty for an item nobody has counted since it was added' do
    expect(described_class.call(item: item)[:entries]).to be_empty
  end

  describe 'the alert' do
    it 'describes the rule watching this item' do
      Inventory::EmailRule.create!(
        inventory_item_id: item.id, operator: 'lt_eq', threshold: 8, mail_to_user_id: counter.id
      )

      expect(described_class.call(item: item)[:alert]).to include(
        operator: 'lt_eq', threshold: 8, user_name: counter.full_name
      )
    end

    it 'is nil when nothing watches the item' do
      expect(described_class.call(item: item)[:alert]).to be_nil
    end
  end

  # A quartermaster member can see a threshold but cannot reach the alerts
  # screen, so the links to it are withheld rather than offered as a redirect.
  it 'reports whether this viewer can manage alerts' do
    expect(described_class.call(item: item, manage_alerts: false)[:can_manage_alerts]).to be(false)
    expect(described_class.call(item: item, manage_alerts: true)[:can_manage_alerts]).to be(true)
  end
end
