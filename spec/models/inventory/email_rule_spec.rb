# frozen_string_literal: true

# == Schema Information
#
# Table name: inventory_email_rules
#
#  id                :integer          not null, primary key
#  operator          :string
#  threshold         :integer
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  inventory_item_id :integer
#  mail_to_user_id   :integer
#
# Indexes
#
#  index_inventory_email_rules_on_inventory_item_id  (inventory_item_id)
#  index_inventory_email_rules_on_mail_to_user_id    (mail_to_user_id)
#
require 'rails_helper'

RSpec.describe Inventory::EmailRule, type: :model do
  let(:user) { create(:user) }
  let(:category) { create(:inventory_category) }
  let(:item) { Inventory::Item.create(name: 'Test Item', quantity: 50, inventory_category_id: category.id) }

  describe 'validations' do
    it 'requires all fields' do
      rule = Inventory::EmailRule.new
      expect(rule).not_to be_valid
      expect(rule.errors[:mail_to_user_id]).to be_present
      expect(rule.errors[:inventory_item_id]).to be_present
      expect(rule.errors[:threshold]).to be_present
      expect(rule.errors[:operator]).to be_present
    end
  end

  describe 'associations' do
    let(:rule) do
      Inventory::EmailRule.create(
        mail_to_user_id: user.id,
        inventory_item_id: item.id,
        threshold: 20,
        operator: 'lt'
      )
    end

    it 'belongs to user and inventory item' do
      expect(rule.user).to eq(user)
      expect(rule.inventory_item).to eq(item)
    end
  end

  describe '#notify_if_applicable' do
    let(:rule) do
      Inventory::EmailRule.create(
        mail_to_user_id: user.id,
        inventory_item_id: item.id,
        threshold: 30,
        operator: operator
      )
    end

    before do
      allow(rule).to receive(:notify)
    end

    context 'with less than operator' do
      let(:operator) { 'lt' }

      it 'notifies when quantity is below threshold' do
        rule.notify_if_applicable(25)
        expect(rule).to have_received(:notify)
      end

      it 'does not notify when quantity is at or above threshold' do
        rule.notify_if_applicable(30)
        expect(rule).not_to have_received(:notify)
      end
    end

    context 'with equal operator' do
      let(:operator) { 'eq' }

      it 'notifies when quantity equals threshold' do
        rule.notify_if_applicable(30)
        expect(rule).to have_received(:notify)
      end

      it 'does not notify when quantity differs' do
        rule.notify_if_applicable(25)
        expect(rule).not_to have_received(:notify)
      end
    end

    context 'with greater than operator' do
      let(:operator) { 'gt' }

      it 'notifies when quantity is above threshold' do
        rule.notify_if_applicable(35)
        expect(rule).to have_received(:notify)
      end

      it 'does not notify when quantity is at or below threshold' do
        rule.notify_if_applicable(30)
        expect(rule).not_to have_received(:notify)
      end
    end
  end
end
