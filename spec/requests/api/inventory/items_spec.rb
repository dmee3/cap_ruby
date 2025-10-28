# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::Inventory::Items', type: :request do
  let(:season) { create(:season, year: '2026') }
  let(:category) { create(:inventory_category, name: 'Sticks') }
  let(:item) { Inventory::Item.create(name: 'Vic Firth 5A', quantity: 50, inventory_category_id: category.id) }
  let(:admin) { create(:user) }

  before do
    create(:seasons_user, user: admin, season: season, role: 'admin')
  end

  describe 'PATCH /api/inventory/categories/:category_id/items/:id' do
    before do
      sign_in admin
      cookies[:cap_season_id] = season.id
    end

    it 'updates item quantity' do
      patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
            params: { item: { quantity: 75 } }

      expect(response).to have_http_status(:success)
      item.reload
      expect(item.quantity).to eq(75)
    end

    it 'creates transaction record when quantity changes' do
      expect do
        patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
              params: { item: { quantity: 60 } }
      end.to change(Inventory::Transaction, :count).by(1)

      transaction = Inventory::Transaction.last
      expect(transaction.change).to eq(10)
      expect(transaction.previous_quantity).to eq(50)
      expect(transaction.user_id).to eq(admin.id)
    end

    it 'does not create transaction if quantity unchanged' do
      expect do
        patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
              params: { item: { name: 'Updated Name' } }
      end.not_to change(Inventory::Transaction, :count)
    end

    it 'triggers email rules when quantity changes' do
      rule = Inventory::EmailRule.create(
        inventory_item_id: item.id,
        operator: '<',
        threshold: 55,
        mail_to_user_id: admin.id
      )
      allow(rule).to receive(:notify_if_applicable)
      allow(Inventory::EmailRule).to receive(:where).and_return([rule])

      patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
            params: { item: { quantity: 40 } }

      expect(rule).to have_received(:notify_if_applicable).with(40)
    end
  end
end
