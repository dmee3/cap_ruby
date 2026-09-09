# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::Admin::PaymentSchedules', type: :request do
  let(:season) { create(:season, year: '2026') }
  let!(:admin) { sign_in_as_admin(season: season) }
  let(:member) do
    create(:user, first_name: 'Sam', last_name: 'Reed').tap do |u|
      create(:seasons_user, user: u, season: season, role: 'member', ensemble: 'World', section: 'Snare')
    end
  end
  let(:schedule) { create(:payment_schedule, season: season, user: member) }

  describe 'GET /api/admin/payment_schedules/:id/default-preview' do
    it 'returns the default entries plus a diff against the current schedule' do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 10, 17), amount: 99_900)

      get "/api/admin/payment_schedules/#{schedule.id}/default-preview"

      expect(response).to have_http_status(:success)
      body = response.parsed_body
      expect(body['entries'].first).to include('pay_date' => '2025-10-17', 'amount_cents' => 50_000)
      changed = body['diff'].find { |row| row['pay_date'] == '2025-10-17' }
      expect(changed).to include('kind' => 'changed', 'from_cents' => 99_900, 'to_cents' => 50_000)
    end

    it '422s when the member has no default schedule' do
      orphan = create(:payment_schedule, season: season, user: create(:user))
      get "/api/admin/payment_schedules/#{orphan.id}/default-preview"
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'POST /api/admin/payment_schedules/apply-default' do
    it 'preserves entries covered by a payment and rewrites the rest' do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 10, 17), amount: 40_000)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2026, 7, 1), amount: 12_300)
      create(:payment, user: member, season: season, amount: 40_000, date_paid: Date.new(2025, 10, 18))

      post '/api/admin/payment_schedules/apply-default', params: { payment_schedule_id: schedule.id }

      expect(response).to have_http_status(:ok)
      schedule.reload
      expect(schedule.entries.where(pay_date: Date.new(2025, 10, 17)).pluck(:amount)).to eq([40_000])
      expect(schedule.entries.map(&:pay_date)).not_to include(Date.new(2026, 7, 1))
      expect(schedule.entries.count).to eq(6)
    end

    it 'is still reachable at the legacy create-default path' do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2020, 1, 1), amount: 1)

      post '/api/admin/payment_schedules/create-default', params: { payment_schedule_id: schedule.id }

      expect(response).to have_http_status(:ok)
      expect(schedule.reload.entries.count).to eq(6)
    end

    it 'denies non-admins' do
      sign_in_as_member(season: season)
      post '/api/admin/payment_schedules/apply-default',
           params: { payment_schedule_id: schedule.id }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
