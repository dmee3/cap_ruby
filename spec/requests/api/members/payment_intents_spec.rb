# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::Members::PaymentIntents', type: :request do
  let(:season) { create(:season, year: '2026') }
  let(:member) { create(:user) }

  before do
    create(:seasons_user, user: member, season: season, role: 'member')
  end

  describe 'POST /api/members/payment_intents' do
    context 'when unauthenticated' do
      it 'redirects to login' do
        post '/api/members/payment_intents', params: { total: 100, amount: 100 }
        expect(response).to redirect_to(new_user_session_path)
      end
    end

    context 'when authenticated as member' do
      before do
        sign_in member
        cookies[:cap_season_id] = season.id
      end

      it 'creates Stripe payment intent and records in database' do
        stripe_pi = { 'id' => 'pi_test_123', 'client_secret' => 'secret_456' }
        allow(Stripe::PaymentIntent).to receive(:create).and_return(stripe_pi)

        expect do
          post '/api/members/payment_intents', params: { total: 50.00, amount: 50.00 }
        end.to change(PaymentIntent, :count).by(1)

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['clientSecret']).to eq('secret_456')
      end

      it 'converts dollars to cents for Stripe' do
        stripe_pi = { 'id' => 'pi_test_123', 'client_secret' => 'secret_456' }
        allow(Stripe::PaymentIntent).to receive(:create).and_return(stripe_pi)

        post '/api/members/payment_intents', params: { total: 50.00, amount: 50.00 }

        expect(Stripe::PaymentIntent).to have_received(:create).with(
          hash_including(
            amount: 5000,
            currency: 'usd',
            metadata: hash_including(
              charge_type: 'dues_payment',
              user_id: member.id
            )
          )
        )
      end

      it 'stores payment intent in database' do
        stripe_pi = { 'id' => 'pi_test_123', 'client_secret' => 'secret_456' }
        allow(Stripe::PaymentIntent).to receive(:create).and_return(stripe_pi)

        post '/api/members/payment_intents', params: { total: 75.00, amount: 75.00 }

        payment_intent = PaymentIntent.last
        expect(payment_intent.user).to eq(member)
        expect(payment_intent.stripe_pi_id).to eq('pi_test_123')
        expect(payment_intent.amount).to eq(7500)
      end
    end
  end
end
