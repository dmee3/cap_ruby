# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Conflicts Workflow', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:pending_status) { create(:conflict_status, name: 'Pending') }
  let(:approved_status) { create(:conflict_status, name: 'Approved') }

  before do
    # Stub external services
    allow(ActivityLogger).to receive(:log_conflict)
    allow(EmailService).to receive(:send_conflict_submitted_email)
  end

  describe 'Member submits a new conflict' do
    it 'creates a conflict in pending state' do
      member = sign_in_as_member(season: season)
      pending_status # Ensure pending status exists

      expect do
        post '/members/conflicts', params: {
          conflict: {
            start_date: 1.week.from_now,
            end_date: 2.weeks.from_now,
            reason: 'Family vacation'
          }
        }
      end.to change(Conflict, :count).by(1)

      conflict = Conflict.last
      expect(conflict.user).to eq(member)
      expect(conflict.season).to eq(season)
      expect(conflict.conflict_status.name).to eq('Pending')
      expect(conflict.reason).to eq('Family vacation')
      expect(response).to redirect_to(root_url)
      expect(flash[:success]).to match(/submitted for review/)
    end

    it 'rejects conflicts with past start dates' do
      member = sign_in_as_member(season: season)
      pending_status

      expect do
        post '/members/conflicts', params: {
          conflict: {
            start_date: 1.week.ago,
            end_date: 2.weeks.from_now,
            reason: 'Family vacation'
          }
        }
      end.not_to change(Conflict, :count)

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Start date must be in the future')
    end

    it 'rejects conflicts with past end dates' do
      member = sign_in_as_member(season: season)
      pending_status

      expect do
        post '/members/conflicts', params: {
          conflict: {
            start_date: 1.week.from_now,
            end_date: 1.day.ago,
            reason: 'Family vacation'
          }
        }
      end.not_to change(Conflict, :count)

      expect(response).to have_http_status(:success)
      expect(response.body).to include('End date must be in the future')
    end
  end

  describe 'Coordinator approves a conflict' do
    let(:member) { create(:user) }
    let!(:conflict) do
      create(
        :conflict,
        user: member,
        season: season,
        conflict_status: pending_status,
        start_date: 1.week.from_now,
        end_date: 2.weeks.from_now
      )
    end

    before do
      create(:seasons_user, user: member, season: season, role: 'member')
      sign_in_as_coordinator(season: season)
    end

    it 'updates the conflict status to approved' do
      patch "/coordinators/conflicts/#{conflict.id}", params: {
        conflict: {
          status_id: approved_status.id
        }
      }

      conflict.reload
      expect(conflict.conflict_status).to eq(approved_status)
      expect(flash[:success]).to match(/updated/)
    end

    it 'updates conflict via API endpoint' do
      patch "/api/coordinators/conflicts/#{conflict.id}", params: {
        conflict: {
          status_id: approved_status.id
        }
      }, as: :json

      conflict.reload
      expect(conflict.conflict_status).to eq(approved_status)
      expect(response).to have_http_status(:success)
    end

    it 'can create conflicts with past dates' do
      expect do
        post '/coordinators/conflicts', params: {
          conflict: {
            user_id: member.id,
            status_id: approved_status.id,
            start_date: 1.week.ago,
            end_date: 1.day.ago,
            reason: 'Retroactive conflict entry'
          }
        }
      end.to change(Conflict, :count).by(1)

      conflict = Conflict.last
      expect(conflict.start_date).to be < Time.current
      expect(flash[:success]).to match(/created/)
    end
  end

  describe 'Member views their conflicts' do
    let(:member) { sign_in_as_member(season: season) }
    let!(:payment_schedule) { create(:payment_schedule, user: member, season: season) }
    let!(:schedule_entry) do
      create(:payment_schedule_entry, payment_schedule: payment_schedule, pay_date: 1.week.from_now)
    end
    let!(:member_conflict) do
      create(
        :conflict,
        user: member,
        season: season,
        conflict_status: approved_status,
        start_date: 1.week.from_now
      )
    end
    let!(:other_conflict) do
      other_user = create(:user)
      create(:seasons_user, user: other_user, season: season, role: 'member')
      create(:conflict, user: other_user, season: season)
    end

    it 'shows conflicts on member dashboard' do
      get '/members'

      expect(response).to have_http_status(:success)
      # Verify conflict is present by checking the date
      expect(response.body).to include(member_conflict.start_date.strftime('%a, %-m/%-d'))
    end
  end

  describe 'Admin can view and edit conflicts' do
    let(:member) { create(:user) }
    let!(:conflict) do
      create(:seasons_user, user: member, season: season, role: 'member')
      create(
        :conflict,
        user: member,
        season: season,
        conflict_status: pending_status
      )
    end

    before { sign_in_as_admin(season: season) }

    it 'can access conflicts index page' do
      get '/admin/conflicts'

      expect(response).to have_http_status(:success)
    end

    it 'can update conflicts via API' do
      patch "/api/admin/conflicts/#{conflict.id}", params: {
        conflict: {
          status_id: approved_status.id
        }
      }, as: :json

      conflict.reload
      expect(conflict.conflict_status).to eq(approved_status)
      expect(response).to have_http_status(:success)
    end

    it 'can edit conflict page' do
      get "/admin/conflicts/#{conflict.id}/edit"

      expect(response).to have_http_status(:success)
    end

    it 'can create conflicts with past dates' do
      expect do
        post '/admin/conflicts', params: {
          conflict: {
            user_id: member.id,
            status_id: approved_status.id,
            start_date: 1.week.ago,
            end_date: 1.day.ago,
            reason: 'Retroactive conflict entry'
          }
        }
      end.to change(Conflict, :count).by(1)

      conflict = Conflict.last
      expect(conflict.start_date).to be < Time.current
      expect(flash[:success]).to match(/created/)
    end
  end
end
