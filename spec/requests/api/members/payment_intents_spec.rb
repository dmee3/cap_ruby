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
        post '/api/members/payment_intents', params: { amount: 100 }
        expect(response).to redirect_to(new_user_session_path)
      end
    end

    context 'when authenticated as member' do
      let(:stripe_pi) { { 'id' => 'pi_test_123', 'client_secret' => 'secret_456' } }

      before do
        sign_in member
        cookies[:cap_season_id] = season.id
        allow(Stripe::PaymentIntent).to receive(:create).and_return(stripe_pi)
      end

      it 'creates a Stripe payment intent and a local record' do
        expect do
          post '/api/members/payment_intents', params: { amount: 50.00 }
        end.to change(PaymentIntent, :count).by(1)

        expect(response).to have_http_status(:success)
        expect(JSON.parse(response.body)['clientSecret']).to eq('secret_456')
      end

      it 'charges the card the fee-grossed-up total, computed server-side' do
        # $50.00 -> 5000c dues -> StripeFees.total_cents(5000) = round(5000/0.97 + 30) = 5185c
        post '/api/members/payment_intents', params: { amount: 50.00 }

        expect(Stripe::PaymentIntent).to have_received(:create).with(
          hash_including(
            amount: StripeFees.total_cents(5000),
            currency: 'usd',
            metadata: hash_including(charge_type: 'dues_payment', user_id: member.id)
          )
        )
        expect(StripeFees.total_cents(5000)).to eq(5185)
      end

      it 'records the pre-fee amount (toward dues) on the local PaymentIntent' do
        post '/api/members/payment_intents', params: { amount: 75.00 }

        pi = PaymentIntent.last
        expect(pi.user).to eq(member)
        expect(pi.stripe_pi_id).to eq('pi_test_123')
        expect(pi.amount).to eq(7500)
      end

      it 'ignores a client-supplied total and always recomputes the fee' do
        post '/api/members/payment_intents', params: { amount: 100.00, total: 100.00 }

        expect(Stripe::PaymentIntent).to have_received(:create).with(
          hash_including(amount: StripeFees.total_cents(10_000))
        )
        expect(PaymentIntent.last.amount).to eq(10_000)
      end
    end
  end
end
