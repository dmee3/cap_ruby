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
