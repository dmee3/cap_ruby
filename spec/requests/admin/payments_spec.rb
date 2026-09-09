# frozen_string_literal: true

require 'rails_helper'
require 'benchmark'

RSpec.describe 'Admin::Payments', type: :request do
  let(:season) { create(:season, year: '2026') }
  let(:cash) { create(:payment_type, name: 'Cash') }
  let!(:admin) { sign_in_as_admin(season: season) }
  let(:member) do
    create(:user, first_name: 'Rae', last_name: 'Quinn').tap do |u|
      create(:seasons_user, user: u, season: season, role: 'member')
    end
  end

  describe 'GET /admin/payments.json' do
    before do
      create(:payment, user: member, season: season, payment_type: cash,
                       amount: 10_000, date_paid: Date.new(2026, 1, 5))
      create(:payment, user: member, season: season, payment_type: cash,
                       amount: 20_000, date_paid: Date.new(2026, 2, 5))
    end

    it 'returns the filtered/paginated view-model shape' do
      get '/admin/payments', params: { sort: 'amount', dir: 'asc', limit: 1 },
                             headers: { 'Accept' => 'application/json' }

      expect(response).to have_http_status(:success)
      body = response.parsed_body
      expect(body['payments'].length).to eq(1)
      expect(body['payments'].first['amount_cents']).to eq(10_000)
      expect(body['total_count']).to eq(2)
      expect(body['total_cents']).to eq(30_000)
      expect(body['has_more']).to be(true)
    end

    it 'denies non-admins' do
      sign_in_as_member(season: season)
      get '/admin/payments', headers: { 'Accept' => 'application/json' }
      expect(response).to have_http_status(:found).or have_http_status(:unauthorized)
    end
  end

  describe 'POST /admin/payments' do
    let(:params) do
      { payment: { user_id: member.id, payment_type_id: cash.id, amount: 50, date_paid: '2026-01-15' } }
    end

    it 'creates the payment in cents, logs it, and redirects without an artificial delay' do
      elapsed = Benchmark.realtime do
        expect { post '/admin/payments', params: params }.to change(Payment, :count).by(1)
      end

      expect(elapsed).to be < 2 # the old `sleep 5` is gone
      expect(response).to redirect_to(admin_payments_path)
      expect(Payment.last.amount).to eq(5000)
    end

    it 'does not persist a payment or the activity log when the payment is invalid' do
      allow_any_instance_of(Payment).to receive(:save).and_return(false)

      expect do
        expect { post '/admin/payments', params: params }.not_to change(Payment, :count)
      end.not_to change(Activity, :count)

      expect(response).to have_http_status(:success) # re-renders the form
    end
  end

  describe 'GET /admin/payments/burndown-chart' do
    it 'returns weekly season-scoped scheduled and actual series' do
      schedule = create(:payment_schedule, season: season, user: member)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2026, 1, 5), amount: 30_000)

      get '/admin/payments/burndown-chart'

      body = response.parsed_body
      expect(body['scheduled']).to be_an(Array)
      expect(body['actual']).to be_an(Array)
      expect(body['today']).to eq(Date.current.iso8601)
      expect(body['currency']).to eq('USD')
    end
  end
end
