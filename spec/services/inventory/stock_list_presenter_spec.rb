# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Inventory::StockListPresenter do
  let(:user) { create(:user) }
  let(:sticks) { create(:inventory_category, name: 'Sticks') }
  let(:uniforms) { create(:inventory_category, name: 'Uniforms') }

  def item(name, quantity, category)
    Inventory::Item.create!(name: name, quantity: quantity, inventory_category_id: category.id)
  end

  def rule(item, operator, threshold)
    Inventory::EmailRule.create!(
      inventory_item_id: item.id, operator: operator, threshold: threshold,
      mail_to_user_id: user.id
    )
  end

  describe 'status' do
    it 'calls an item with no rule and stock on hand ok' do
      item('Snare sticks', 42, sticks)
      expect(statuses.fetch('Snare sticks')).to eq('ok')
    end

    it 'calls an item under its own rule low' do
      rule(item('Keyboard mallets', 6, sticks), 'lt_eq', 8)
      expect(statuses.fetch('Keyboard mallets')).to eq('low')
    end

    it 'leaves an item above its rule alone' do
      rule(item('Tenor heads', 12, sticks), 'lt_eq', 5)
      expect(statuses.fetch('Tenor heads')).to eq('ok')
    end

    # Out beats low: an item at zero needs attention whether or not anyone
    # wrote a rule for it.
    it 'calls a zero-quantity item out, rule or no rule' do
      item('Gloves', 0, uniforms)
      rule(item('Pants', 0, uniforms), 'lt_eq', 4)

      expect(statuses.fetch('Gloves')).to eq('out')
      expect(statuses.fetch('Pants')).to eq('out')
    end
  end

  describe 'stats' do
    it 'counts tracked, under-alert, out, and unwatched items' do
      item('Snare sticks', 42, sticks)
      rule(item('Keyboard mallets', 6, sticks), 'lt_eq', 8)
      item('Gloves', 0, uniforms)

      expect(described_class.call[:stats]).to eq(
        tracked: 3, under_alert: 1, out_of_stock: 1, no_alert: 2
      )
    end
  end

  describe 'ordering' do
    it 'sorts empty categories last so they never sit between stocked ones' do
      create(:inventory_category, name: 'Aaa empty')
      item('Snare sticks', 42, sticks)

      expect(described_class.call[:categories].map { |c| c[:name] }).to eq(['Sticks', 'Aaa empty'])
    end

    it 'sorts items within a category by name' do
      item('Zeta', 1, sticks)
      item('alpha', 1, sticks)

      names = described_class.call[:categories].first[:items].map { |i| i[:name] }
      expect(names).to eq(%w[alpha Zeta])
    end
  end

  describe 'last change' do
    it 'names whoever most recently counted anything' do
      Inventory::Transaction.create!(
        inventory_item_id: item('Snare sticks', 42, sticks).id, user_id: user.id,
        change: 42, previous_quantity: 0, performed_on: Date.new(2026, 3, 7)
      )

      expect(described_class.call[:last_change]).to eq(
        performed_on: Date.new(2026, 3, 7), user_name: user.full_name
      )
    end

    it 'is nil before anything has been counted' do
      expect(described_class.call[:last_change]).to be_nil
    end
  end

  describe 'alert visibility' do
    it 'reports whether this viewer can manage alerts' do
      expect(described_class.call(manage_alerts: false)[:can_manage_alerts]).to be(false)
      expect(described_class.call(manage_alerts: true)[:can_manage_alerts]).to be(true)
    end
  end

  def statuses
    described_class.call[:categories]
                   .flat_map { |c| c[:items] }
                   .to_h { |i| [i[:name], i[:status]] }
  end
end
