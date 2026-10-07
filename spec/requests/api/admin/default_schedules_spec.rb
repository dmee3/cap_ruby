# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::Admin::DefaultSchedules', type: :request do
  let(:previous) { create(:season, year: '2026') }
  let(:season) { create(:season, year: '2027') }
  let!(:admin) { sign_in_as_admin(season: season) }

  before { seed_default_schedules(previous) }

  describe 'POST /api/admin/default-schedules/copy' do
    it "copies into the admin's current season" do
      post '/api/admin/default-schedules/copy', params: { source_season_id: previous.id, shift_weeks: 52 }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['created'].size).to eq(8)
      expect(DefaultScheduleEntry.where(season: season).minimum(:pay_date)).to eq(Date.new(2026, 10, 16))
    end

    it 'explains a refused copy' do
      post '/api/admin/default-schedules/copy', params: { source_season_id: season.id, shift_weeks: 52 }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']).to eq("Can't copy a season into itself.")
    end
  end

  describe 'PUT /api/admin/default-schedules/:combination' do
    it 'saves the amounts it is sent as cents and returns the combination' do
      put '/api/admin/default-schedules/world-music-vet',
          params: { entries: [{ pay_date: '2026-10-16', amount_cents: 50_000 }] }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include('slug' => 'world-music-vet', 'total_cents' => 50_000)
      expect(DefaultScheduleEntry.find_by(season: season).amount_cents).to eq(50_000)
    end

    it 'returns per-row errors' do
      put '/api/admin/default-schedules/world-music-vet',
          params: { entries: [{ pay_date: '2026-10-16', amount_cents: 0 }] }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['errors'])
        .to eq([{ 'index' => 0, 'message' => 'Enter an amount over $0, or remove this payment.' }])
    end
  end

  describe 'PUT /api/admin/default-schedules/dates' do
    it 'refuses a date that is not a date' do
      put '/api/admin/default-schedules/dates', params: { moves: [{ from: '2026-10-16', to: 'soon' }] }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'POST /api/admin/default-schedules/apply-to-empty' do
    it 'reports how many empty schedules it filled' do
      seed_default_schedules(season)
      member = create(:user)
      create(:seasons_user, user: member, season: season, role: 'member', ensemble: 'World', section: 'Snare')

      post '/api/admin/default-schedules/apply-to-empty', as: :json

      expect(response.parsed_body).to eq('filled' => 1, 'still_empty' => 0)
    end
  end

  it 'denies non-admins' do
    sign_in_as_coordinator(season: season)

    post '/api/admin/default-schedules/apply-to-empty', as: :json

    expect(response).to have_http_status(:unauthorized)
  end
end
