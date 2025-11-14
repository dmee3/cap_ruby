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

  describe 'POST /api/admin/payments' do
    let(:payment_type) { create(:payment_type, name: 'Venmo') }

    before do
      sign_in admin
      cookies[:cap_season_id] = season.id
    end

    context 'with valid parameters' do
      let(:valid_params) do
        {
          payment: {
            user_id: member.id,
            payment_type_id: payment_type.id,
            amount: 32.30,
            date_paid: '2026-01-15',
            notes: 'Test payment'
          }
        }
      end

      it 'creates a new payment' do
        expect do
          post '/api/admin/payments',
               params: valid_params,
               headers: { 'Content-Type' => 'application/json' },
               as: :json
        end.to change(Payment, :count).by(1)

        expect(response).to have_http_status(:created)
      end

      it 'converts amount to cents correctly' do
        post '/api/admin/payments',
             params: valid_params,
             headers: { 'Content-Type' => 'application/json' },
             as: :json

        payment = Payment.last
        expect(payment.amount).to eq(3230) # $32.30 = 3230 cents
      end

      it 'assigns the payment to the current season' do
        post '/api/admin/payments',
             params: valid_params,
             headers: { 'Content-Type' => 'application/json' },
             as: :json

        payment = Payment.last
        expect(payment.season_id).to eq(season.id)
      end

      it 'returns success response with payment data' do
        post '/api/admin/payments',
             params: valid_params,
             headers: { 'Content-Type' => 'application/json' },
             as: :json

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['payment']).to be_present
      end
    end

    context 'with decimal edge cases' do
      it 'correctly converts $100.99 to cents' do
        post '/api/admin/payments',
             params: {
               payment: {
                 user_id: member.id,
                 payment_type_id: payment_type.id,
                 amount: 100.99,
                 date_paid: '2026-01-15'
               }
             },
             headers: { 'Content-Type' => 'application/json' },
             as: :json

        expect(Payment.last.amount).to eq(10099)
      end

      it 'correctly converts $0.50 to cents' do
        post '/api/admin/payments',
             params: {
               payment: {
                 user_id: member.id,
                 payment_type_id: payment_type.id,
                 amount: 0.50,
                 date_paid: '2026-01-15'
               }
             },
             headers: { 'Content-Type' => 'application/json' },
             as: :json

        expect(Payment.last.amount).to eq(50)
      end
    end

    context 'with invalid parameters' do
      it 'returns error when user_id is missing' do
        post '/api/admin/payments',
             params: {
               payment: {
                 payment_type_id: payment_type.id,
                 amount: 50.00,
                 date_paid: '2026-01-15'
               }
             },
             headers: { 'Content-Type' => 'application/json' },
             as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
        expect(json_response['errors']).to be_present
      end

      it 'denies access to non-admins' do
        sign_in member

        post '/api/admin/payments',
             params: {
               payment: {
                 user_id: member.id,
                 payment_type_id: payment_type.id,
                 amount: 50.00,
                 date_paid: '2026-01-15'
               }
             },
             headers: { 'Content-Type' => 'application/json' },
             as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
