# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Member payment confirmation', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:stripe_type) { create(:payment_type, name: 'Stripe') }
  let!(:member) { sign_in_as_member(season: season) }
  let!(:schedule) { create(:payment_schedule, user: member, season: season) }

  before do
    create(:payment_schedule_entry, payment_schedule: schedule, amount: 30_000, pay_date: 1.week.from_now)
    create(:payment_intent, user: member, season_id: season.id, stripe_pi_id: 'pi_abc', amount: 12_000)
  end

  it 'shows a receipt when the Payment has been written' do
    stripe_type
    create(:payment, user: member, season: season, amount: 12_000,
                     payment_type: PaymentType.stripe, date_paid: Date.current, notes: 'Stripe: pi_abc')

    get '/members/payments/post_processing', params: { redirect_status: 'succeeded', payment_intent: 'pi_abc' }

    expect(response).to have_http_status(:success)
    expect(response.body).to include('Payment received')
    expect(response.body).to include('$120.00')
    expect(response.body).to include('Where you stand now')
    expect(response.body).not_to include('refreshes on its own')
  end

  it 'shows a "confirming" state with a bounded refresh when the webhook has not landed' do
    get '/members/payments/post_processing', params: { redirect_status: 'succeeded', payment_intent: 'pi_abc' }

    expect(response).to have_http_status(:success)
    expect(response.body).to include('Payment confirmed')
    expect(response.body).to include('http-equiv="refresh"')
    expect(response.body).to include('t=1')
  end

  it 'stops refreshing after five tries' do
    get '/members/payments/post_processing',
        params: { redirect_status: 'succeeded', payment_intent: 'pi_abc', t: '5' }

    expect(response.body).not_to include('http-equiv="refresh"')
    expect(response.body).to include('check your dashboard in a')
  end

  it 'shows the declined-card screen on a failed redirect' do
    get '/members/payments/post_processing', params: { redirect_status: 'failed', payment_intent: 'pi_abc' }

    expect(response).to have_http_status(:success)
    expect(response.body).to include("didn't go through")
    expect(response.body).to include('Nothing was charged')
    expect(response.body).to include('Try again')
  end
end
