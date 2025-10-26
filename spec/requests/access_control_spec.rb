# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Role-Based Access Control', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:member_user) { create(:user) }
  let(:staff_user) { create(:user) }
  let(:coordinator_user) { create(:user) }
  let(:admin_user) { create(:user) }

  before do
    create(:seasons_user, user: member_user, season: season, role: 'member')
    create(:seasons_user, user: staff_user, season: season, role: 'staff')
    create(:seasons_user, user: coordinator_user, season: season, role: 'coordinator')
    create(:seasons_user, user: admin_user, season: season, role: 'admin')
  end

  describe 'Unauthenticated users' do
    it 'redirects to login for member pages' do
      get '/members'
      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to login for admin pages' do
      get '/admin'
      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to login for coordinator pages' do
      get '/coordinators'
      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to login for staff pages' do
      get '/staff'
      expect(response).to redirect_to(new_user_session_path)
    end
  end

  describe 'Member access control' do
    before do
      sign_in member_user
      cookies[:cap_season_id] = season.id
      # Member needs payment schedule to view dashboard
      payment_schedule = create(:payment_schedule, user: member_user, season: season)
      create(:payment_schedule_entry, payment_schedule: payment_schedule, pay_date: 1.week.from_now)
    end

    it 'can access member dashboard' do
      get '/members'
      expect(response).to have_http_status(:success)
    end

    it 'cannot access admin pages' do
      get '/admin'
      expect(response).to redirect_to(root_url)
    end

    it 'cannot access coordinator pages' do
      get '/coordinators'
      expect(response).to redirect_to(root_url)
    end

    it 'cannot access staff pages' do
      get '/staff'
      expect(response).to redirect_to(root_url)
    end

    it 'cannot create admin payments' do
      payment_type = create(:payment_type, name: 'Cash')

      post '/admin/payments', params: {
        payment: {
          user_id: member_user.id,
          amount: 100,
          date_paid: Date.today,
          payment_type_id: payment_type.id
        }
      }

      expect(response).to redirect_to(root_url)
      expect(Payment.count).to eq(0)
    end
  end

  describe 'Staff access control' do
    let!(:conflict) do
      create(
        :conflict,
        user: member_user,
        season: season,
        conflict_status: create(:conflict_status, name: 'Pending')
      )
    end

    before do
      sign_in staff_user
      cookies[:cap_season_id] = season.id
    end

    it 'can access staff dashboard' do
      get '/staff'
      expect(response).to have_http_status(:success)
    end

    it 'cannot access admin pages' do
      get '/admin'
      expect(response).to redirect_to(root_url)
    end

    it 'cannot access coordinator pages' do
      get '/coordinators'
      expect(response).to redirect_to(root_url)
    end

    it 'cannot edit conflicts (coordinator-only)' do
      get "/coordinators/conflicts/#{conflict.id}/edit"
      expect(response).to redirect_to(root_url)
    end

    it 'cannot update conflicts (coordinator-only)' do
      approved_status = create(:conflict_status, name: 'Approved')

      patch "/coordinators/conflicts/#{conflict.id}", params: {
        conflict: { status_id: approved_status.id }
      }

      expect(response).to redirect_to(root_url)
      conflict.reload
      expect(conflict.conflict_status.name).to eq('Pending') # Unchanged
    end
  end

  describe 'Coordinator access control' do
    let!(:conflict) do
      create(
        :conflict,
        user: member_user,
        season: season,
        conflict_status: create(:conflict_status, name: 'Pending')
      )
    end

    before do
      sign_in coordinator_user
      cookies[:cap_season_id] = season.id
    end

    it 'can access coordinator dashboard' do
      get '/coordinators'
      expect(response).to have_http_status(:success)
    end

    it 'can access conflicts page' do
      get '/coordinators/conflicts'
      expect(response).to have_http_status(:success)
    end

    it 'can edit conflicts' do
      get "/coordinators/conflicts/#{conflict.id}/edit"
      expect(response).to have_http_status(:success)
    end

    it 'can update conflicts' do
      approved_status = create(:conflict_status, name: 'Approved')
      allow(ActivityLogger).to receive(:log_conflict)

      patch "/coordinators/conflicts/#{conflict.id}", params: {
        conflict: { status_id: approved_status.id }
      }

      expect(response).to have_http_status(:redirect)
      conflict.reload
      expect(conflict.conflict_status).to eq(approved_status)
    end

    it 'cannot access admin user management' do
      get '/admin/users'
      expect(response).to redirect_to(root_url)
    end

    it 'cannot access admin payment management' do
      get '/admin/payments'
      expect(response).to redirect_to(root_url)
    end
  end

  describe 'Admin access control' do
    before do
      sign_in admin_user
      cookies[:cap_season_id] = season.id
      # Create payment schedules for existing members to avoid errors
      [member_user, staff_user, coordinator_user].each do |user|
        create(:payment_schedule, user: user, season: season)
      end
    end

    it 'can access admin dashboard' do
      get '/admin'
      expect(response).to have_http_status(:success)
    end

    it 'can access user management' do
      get '/admin/users'
      expect(response).to have_http_status(:success)
    end

    it 'can access payment management' do
      get '/admin/payments'
      expect(response).to have_http_status(:success)
    end

    it 'can access conflicts management' do
      get '/admin/conflicts'
      expect(response).to have_http_status(:success)
    end
  end
end
