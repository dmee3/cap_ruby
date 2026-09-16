# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::Inventory::Items', type: :request do
  let(:season) { create(:season, year: '2026') }
  let(:category) { create(:inventory_category, name: 'Sticks') }
  let(:item) do
    Inventory::Item.create(name: 'Vic Firth 5A', quantity: 50, inventory_category_id: category.id)
  end
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
        operator: 'lt',
        threshold: 55,
        mail_to_user_id: admin.id
      )
      allow(rule).to receive(:notify_if_applicable)
      allow(Inventory::EmailRule).to receive(:where).and_return([rule])

      patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
            params: { item: { quantity: 40 } }

      expect(rule).to have_received(:notify_if_applicable).with(40)
    end

    it 'names whoever made the most recent change' do
      patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
            params: { item: { quantity: 44 } }

      expect(response.parsed_body.dig('last_change', 'user_name')).to eq(admin.full_name)
    end

    context 'when the update is rejected' do
      it 'answers 422 with a message the UI can render' do
        patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
              params: { item: { quantity: -5 } }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.parsed_body['errors']).to be_present
      end

      it 'writes no transaction and leaves the quantity alone' do
        expect do
          patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
                params: { item: { quantity: -5 } }
        end.not_to change(Inventory::Transaction, :count)

        expect(item.reload.quantity).to eq(50)
      end
    end

    context 'when someone else has already changed the count' do
      it 'refuses the write and says what the count is now' do
        patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
              params: { item: { quantity: 44, previous_quantity: 42 } }

        expect(response).to have_http_status(:conflict)
        expect(response.parsed_body['current_quantity']).to eq(50)
        expect(item.reload.quantity).to eq(50)
      end

      it 'allows the write when the base still matches' do
        patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
              params: { item: { quantity: 44, previous_quantity: 50 } }

        expect(response).to have_http_status(:success)
        expect(item.reload.quantity).to eq(44)
      end
    end
  end

  describe 'DELETE /api/inventory/categories/:category_id/items/:id' do
    before do
      sign_in admin
      cookies[:cap_season_id] = season.id
    end

    it 'soft-deletes the item, keeping its history' do
      Inventory::Transaction.create!(
        inventory_item_id: item.id, user_id: admin.id,
        change: 50, previous_quantity: 0, performed_on: Date.today
      )

      expect do
        delete "/api/inventory/categories/#{category.id}/items/#{item.id}"
      end.not_to change(Inventory::Transaction, :count)

      expect(response).to have_http_status(:no_content)
      expect(Inventory::Item.find_by(id: item.id)).to be_nil
      expect(Inventory::Item.with_deleted.find_by(id: item.id)).to be_present
    end
  end

  describe 'authorization' do
    let(:member) { create(:user, inventory_access: false) }
    let(:quartermaster) { create(:user, inventory_access: true) }

    it 'refuses a member without inventory access' do
      create(:seasons_user, user: member, season: season, role: 'member')
      sign_in member
      cookies[:cap_season_id] = season.id

      patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
            params: { item: { quantity: 1 } }

      expect(response).to have_http_status(:unauthorized)
      expect(item.reload.quantity).to eq(50)
    end

    it 'allows a quartermaster member' do
      create(:seasons_user, user: quartermaster, season: season, role: 'member')
      sign_in quartermaster
      cookies[:cap_season_id] = season.id

      patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
            params: { item: { quantity: 51 } }

      expect(response).to have_http_status(:success)
    end

    it 'refuses an unauthenticated visitor' do
      patch "/api/inventory/categories/#{category.id}/items/#{item.id}",
            params: { item: { quantity: 1 } }

      expect(response).not_to have_http_status(:success)
      expect(item.reload.quantity).to eq(50)
    end
  end
end
