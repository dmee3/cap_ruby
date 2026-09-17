# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Inventory Access Control', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:category) { create(:inventory_category) }

  describe 'Admin access' do
    let(:admin_user) { create(:user) }

    before do
      create(:seasons_user, user: admin_user, season: season, role: 'admin')
      sign_in admin_user
      cookies[:cap_season_id] = season.id
    end

    it 'can access inventory categories list' do
      get '/inventory/categories'
      expect(response).to have_http_status(:success)
    end

    it 'can create new category' do
      get '/inventory/categories/new'
      expect(response).to have_http_status(:success)
    end

    it 'can access inventory items' do
      get "/inventory/categories/#{category.id}/items/new"
      expect(response).to have_http_status(:success)
    end

    it 'can access email rules' do
      get '/inventory/email_rules'
      expect(response).to have_http_status(:success)
    end
  end

  describe 'Coordinator access' do
    let(:coordinator_user) { create(:user) }

    before do
      create(:seasons_user, user: coordinator_user, season: season, role: 'coordinator')
      sign_in coordinator_user
      cookies[:cap_season_id] = season.id
    end

    it 'can access inventory categories list' do
      get '/inventory/categories'
      expect(response).to have_http_status(:success)
    end

    it 'can create new category' do
      get '/inventory/categories/new'
      expect(response).to have_http_status(:success)
    end

    it 'can access inventory items' do
      get "/inventory/categories/#{category.id}/items/new"
      expect(response).to have_http_status(:success)
    end

    it 'can access email rules' do
      get '/inventory/email_rules'
      expect(response).to have_http_status(:success)
    end
  end

  describe 'Member with quartermaster access' do
    let(:quartermaster_user) { create(:user, inventory_access: true) }

    before do
      create(:seasons_user, user: quartermaster_user, season: season, role: 'member')
      sign_in quartermaster_user
      cookies[:cap_season_id] = season.id
    end

    it 'can access inventory categories list' do
      get '/inventory/categories'
      expect(response).to have_http_status(:success)
    end

    it 'can create new category' do
      get '/inventory/categories/new'
      expect(response).to have_http_status(:success)
    end

    it 'can access inventory items' do
      get "/inventory/categories/#{category.id}/items/new"
      expect(response).to have_http_status(:success)
    end

    it 'cannot access email rules (admin/coordinator only)' do
      get '/inventory/email_rules'
      expect(response).to redirect_to(root_url)
    end

    it 'has quartermaster? method return true' do
      expect(quartermaster_user.quartermaster?).to be true
    end
  end

  describe 'Staff with quartermaster access' do
    let(:quartermaster_staff) { create(:user, inventory_access: true) }

    before do
      create(:seasons_user, user: quartermaster_staff, season: season, role: 'staff')
      sign_in quartermaster_staff
      cookies[:cap_season_id] = season.id
    end

    it 'can access inventory categories list' do
      get '/inventory/categories'
      expect(response).to have_http_status(:success)
    end

    it 'can create new category' do
      get '/inventory/categories/new'
      expect(response).to have_http_status(:success)
    end

    it 'cannot access email rules (admin/coordinator only)' do
      get '/inventory/email_rules'
      expect(response).to redirect_to(root_url)
    end
  end

  describe 'Member without quartermaster access (denied)' do
    let(:member_user) { create(:user, inventory_access: false) }

    before do
      create(:seasons_user, user: member_user, season: season, role: 'member')
      sign_in member_user
      cookies[:cap_season_id] = season.id
    end

    it 'cannot access inventory categories list' do
      get '/inventory/categories'
      expect(response).to redirect_to(root_url)
    end

    it 'cannot create new category' do
      get '/inventory/categories/new'
      expect(response).to redirect_to(root_url)
    end

    it 'cannot access inventory items' do
      get "/inventory/categories/#{category.id}/items/new"
      expect(response).to redirect_to(root_url)
    end

    it 'cannot access email rules' do
      get '/inventory/email_rules'
      expect(response).to redirect_to(root_url)
    end
  end

  describe 'Staff without quartermaster access (denied)' do
    let(:staff_user) { create(:user, inventory_access: false) }

    before do
      create(:seasons_user, user: staff_user, season: season, role: 'staff')
      sign_in staff_user
      cookies[:cap_season_id] = season.id
    end

    it 'cannot access inventory categories list' do
      get '/inventory/categories'
      expect(response).to redirect_to(root_url)
    end

    it 'cannot create new category' do
      get '/inventory/categories/new'
      expect(response).to redirect_to(root_url)
    end

    it 'cannot access inventory items' do
      get "/inventory/categories/#{category.id}/items/new"
      expect(response).to redirect_to(root_url)
    end

    it 'cannot access email rules' do
      get '/inventory/email_rules'
      expect(response).to redirect_to(root_url)
    end
  end

  # Items and categories follow InventoryController (admin / coordinator /
  # quartermaster); email rules keep the extra admin-or-coordinator guard the
  # rest of that screen already has.
  describe 'Destroy permissions' do
    let(:item) do
      Inventory::Item.create(name: 'Snare sticks', quantity: 42, inventory_category_id: category.id)
    end

    def sign_in_as(role, inventory_access:)
      user = create(:user, inventory_access: inventory_access)
      create(:seasons_user, user: user, season: season, role: role)
      sign_in user
      cookies[:cap_season_id] = season.id
      user
    end

    context 'as a quartermaster member' do
      before { sign_in_as('member', inventory_access: true) }

      it 'can delete an item' do
        delete "/inventory/categories/#{category.id}/items/#{item.id}"
        expect(Inventory::Item.find_by(id: item.id)).to be_nil
      end

      it 'can delete an empty category' do
        delete "/inventory/categories/#{category.id}"
        expect(Inventory::Category.find_by(id: category.id)).to be_nil
      end

      it 'cannot delete an email rule' do
        rule = Inventory::EmailRule.create(
          inventory_item_id: item.id, operator: 'lt', threshold: 5,
          mail_to_user_id: create(:user).id
        )

        delete "/inventory/email_rules/#{rule.id}"

        expect(response).to redirect_to(root_url)
        expect(Inventory::EmailRule.find_by(id: rule.id)).to be_present
      end
    end

    context 'as a member without inventory access' do
      before { sign_in_as('member', inventory_access: false) }

      it 'cannot delete an item' do
        delete "/inventory/categories/#{category.id}/items/#{item.id}"

        expect(response).to redirect_to(root_url)
        expect(Inventory::Item.find_by(id: item.id)).to be_present
      end

      it 'cannot delete a category' do
        delete "/inventory/categories/#{category.id}"

        expect(response).to redirect_to(root_url)
        expect(Inventory::Category.find_by(id: category.id)).to be_present
      end
    end

    context 'as a coordinator' do
      before { sign_in_as('coordinator', inventory_access: false) }

      it 'can delete an email rule' do
        rule = Inventory::EmailRule.create(
          inventory_item_id: item.id, operator: 'lt', threshold: 5,
          mail_to_user_id: create(:user).id
        )

        delete "/inventory/email_rules/#{rule.id}"

        expect(Inventory::EmailRule.find_by(id: rule.id)).to be_nil
      end

      it 'refuses to delete a category that still holds items' do
        item

        delete "/inventory/categories/#{category.id}"

        expect(Inventory::Category.find_by(id: category.id)).to be_present
        expect(flash[:error]).to match(/Move or delete its 1 item first/)
      end

      it 'soft-deletes an item so its history survives' do
        Inventory::Transaction.create!(
          inventory_item_id: item.id, user_id: create(:user).id,
          change: 42, previous_quantity: 0, performed_on: Date.today
        )

        expect do
          delete "/inventory/categories/#{category.id}/items/#{item.id}"
        end.not_to change(Inventory::Transaction, :count)

        expect(Inventory::Item.with_deleted.find_by(id: item.id)).to be_present
      end
    end
  end

  describe 'Creating an item' do
    let(:admin_user) { create(:user) }

    before do
      create(:seasons_user, user: admin_user, season: season, role: 'admin')
      sign_in admin_user
      cookies[:cap_season_id] = season.id
    end

    # A trail whose opening balance appears from nowhere is the gap the history
    # screen exists to close.
    it 'logs the opening count as a first transaction' do
      expect do
        post "/inventory/categories/#{category.id}/items",
             params: { inventory_item: { name: 'Carriers', quantity: 24 } }
      end.to change(Inventory::Transaction, :count).by(1)

      transaction = Inventory::Transaction.last
      expect(transaction.change).to eq(24)
      expect(transaction.previous_quantity).to eq(0)
      expect(transaction.user).to eq(admin_user)
    end

    it 'says what to fix and keeps what was typed' do
      post "/inventory/categories/#{category.id}/items",
           params: { inventory_item: { name: '', quantity: -1 } }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.body).to include('things to fix').or include('thing to fix')
      # The form repopulates rather than resetting to blank.
      expect(response.body).to include('value="-1"')
    end
  end

  describe 'Item history' do
    let(:admin_user) { create(:user) }
    let(:item) do
      Inventory::Item.create!(name: 'Snare sticks', quantity: 42, inventory_category_id: category.id)
    end

    before do
      create(:seasons_user, user: admin_user, season: season, role: 'admin')
      sign_in admin_user
      cookies[:cap_season_id] = season.id
    end

    it 'renders the trail with the counter named' do
      Inventory::Transaction.create!(
        inventory_item_id: item.id, user_id: admin_user.id,
        change: -6, previous_quantity: 48, performed_on: Date.today
      )

      get "/inventory/categories/#{category.id}/items/#{item.id}"

      expect(response).to have_http_status(:success)
      # Against the payload, not the body: the signed-in user's name is in the
      # profile menu on every page, so a body match passes even with an empty
      # trail.
      history = JSON.parse(response.body[/window\.itemHistory = (.*);/, 1])
      expect(history['entries'].map { |e| e['user_name'] }).to include(admin_user.full_name)
    end

    # '<%=' would double-escape the blob and the widget would never mount.
    it 'embeds the payload as parseable JSON' do
      get "/inventory/categories/#{category.id}/items/#{item.id}"

      blob = response.body[/window\.itemHistory = (.*?);/m, 1]
      expect { JSON.parse(blob) }.not_to raise_error
      expect(JSON.parse(blob).dig('item', 'name')).to eq('Snare sticks')
    end
  end

  describe 'Low-stock alerts' do
    let(:admin_user) { create(:user) }
    let(:item) do
      Inventory::Item.create!(name: 'Keyboard mallets', quantity: 6, inventory_category_id: category.id)
    end

    before do
      create(:seasons_user, user: admin_user, season: season, role: 'admin')
      sign_in admin_user
      cookies[:cap_season_id] = season.id
    end

    def rule_for(operator, threshold)
      Inventory::EmailRule.create!(
        inventory_item_id: item.id, operator: operator, threshold: threshold,
        mail_to_user_id: admin_user.id
      )
    end

    it 'reads each rule as a sentence, never as an enum name' do
      rule_for('lt_eq', 8)

      get '/inventory/email_rules'

      expect(response.body).to include('is at or below')
      expect(response.body).not_to include('lt_eq')
    end

    it 'marks a rule whose condition is true right now' do
      rule_for('lt_eq', 8)

      get '/inventory/email_rules'

      expect(response.body).to include('Firing now')
    end

    it 'leaves a rule that is not currently met unmarked' do
      rule_for('lt_eq', 2)

      get '/inventory/email_rules'

      expect(response.body).not_to include('Firing now')
    end

    it 'invites a first alert when none exist' do
      get '/inventory/email_rules'

      expect(response.body).to include('No alerts set up')
    end

    it 'offers the five conditions in plain language on the form' do
      get '/inventory/email_rules/new'

      expect(response.body).to include('is exactly', 'is below', 'is at or below',
                                       'is above', 'is at or above')
    end

    it 'pre-selects an item when the prompt names one' do
      get "/inventory/email_rules/new?inventory_item_id=#{item.id}"

      expect(response.body).to match(/<option[^>]*selected[^>]*value="#{item.id}"[^>]*>Keyboard mallets/)
    end

    it 'keeps the form filled in and says what to fix when it is rejected' do
      post '/inventory/email_rules',
           params: { inventory_email_rule: { inventory_item_id: item.id, operator: 'lt_eq',
                                             threshold: '', mail_to_user_id: admin_user.id } }

      expect(response.body).to include('thing to fix').or include('things to fix')
      expect(Inventory::EmailRule.count).to eq(0)
    end

    it 'offers delete from inside the edit form, not the list' do
      rule = rule_for('lt_eq', 8)

      get '/inventory/email_rules'
      expect(response.body).not_to include('Delete this alert')

      get "/inventory/email_rules/#{rule.id}/edit"
      expect(response.body).to include('Delete this alert')
    end
  end

  describe 'Unauthenticated users' do
    it 'redirects to login for inventory pages' do
      get '/inventory/categories'
      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to login for email rules' do
      get '/inventory/email_rules'
      expect(response).to redirect_to(new_user_session_path)
    end
  end
end
