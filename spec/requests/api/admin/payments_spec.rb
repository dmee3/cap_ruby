# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::Admin::Payments', type: :request do
  let(:season) { create(:season, year: '2026') }
  let(:admin) { create(:user) }
  let(:member) { create(:user) }

  before do
    create(:seasons_user, user: admin, season: season, role: 'admin')
    create(:seasons_user, user: member, season: season, role: 'member')
  end

  describe 'access control' do
    it 'denies access to non-admins' do
      sign_in member
      cookies[:cap_season_id] = season.id

      get '/api/admin/payments', headers: { 'Accept' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'allows admins' do
      sign_in admin
      cookies[:cap_season_id] = season.id
      allow(PaymentService).to receive(:season_payment_details).and_return([])

      get '/api/admin/payments', headers: { 'Accept' => 'application/json' }
      expect(response).to have_http_status(:success)
    end
  end

  describe 'GET /api/admin/payments' do
    before do
      sign_in admin
      cookies[:cap_season_id] = season.id
      allow(PaymentService).to receive(:season_payment_details).and_return([])
    end

    it 'calls PaymentService with current season' do
      get '/api/admin/payments', headers: { 'Accept' => 'application/json' }
      expect(PaymentService).to have_received(:season_payment_details).with(season.id)
    end
  end

  describe 'GET /api/admin/payments/collected' do
    before do
      sign_in admin
      cookies[:cap_season_id] = season.id
    end

    it 'returns collected payments as JSON' do
      payment_type = create(:payment_type, name: 'Stripe')
      create(:payment, user: member, season: season, payment_type: payment_type, amount: 5000)

      allow(PaymentService).to receive(:payments_collected_to_date).and_return([{ total: 5000 }])

      get '/api/admin/payments/collected'
      expect(response).to have_http_status(:success)
      expect(response.content_type).to include('application/json')
    end
  end

  describe 'GET /api/admin/payments/upcoming' do
    before do
      sign_in admin
      cookies[:cap_season_id] = season.id
      allow(PaymentService).to receive(:upcoming_payments).and_return([])
    end

    it 'returns upcoming payments with default date range' do
      get '/api/admin/payments/upcoming'
      expect(PaymentService).to have_received(:upcoming_payments)
      expect(response).to have_http_status(:success)
    end

    it 'accepts custom date range' do
      get '/api/admin/payments/upcoming', params: {
        start: '2026-01-01',
        end: '2026-03-01'
      }
      expect(response).to have_http_status(:success)
    end
  end
end
