# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Payments Workflow', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:stripe_payment_type) { create(:payment_type, name: 'Stripe') }
  let(:cash_payment_type) { create(:payment_type, name: 'Cash') }

  before do
    # Stub external services
    allow(ActivityLogger).to receive(:log_payment)
    allow(EmailService).to receive(:send_payment_submitted_email)
  end

  describe 'Member views payment schedule' do
    let(:member) { sign_in_as_member(season: season) }
    let!(:payment_schedule) { create(:payment_schedule, user: member, season: season) }
    let!(:schedule_entry) do
      create(
        :payment_schedule_entry,
        payment_schedule: payment_schedule,
        amount: 50000, # $500
        pay_date: 1.week.from_now
      )
    end

    it 'shows payment schedule on member dashboard' do
      get '/members'

      expect(response).to have_http_status(:success)
    end

    it 'shows correct amount owed' do
      # Create a payment that partially covers the schedule
      create(
        :payment,
        user: member,
        season: season,
        amount: 20000, # $200
        payment_type: cash_payment_type,
        date_paid: Date.today
      )

      amount_paid = member.amount_paid_for(season.id)
      scheduled_to_date = payment_schedule.scheduled_to_date(2.weeks.from_now)

      expect(amount_paid).to eq(20000)
      expect(scheduled_to_date).to eq(50000)
      expect(amount_paid).to be < scheduled_to_date
    end
  end

  describe 'Member makes Stripe payment' do
    let(:member) { sign_in_as_member(season: season) }
    let!(:payment_schedule) { create(:payment_schedule, user: member, season: season) }

    before do
      # Stub Stripe API
      allow(Stripe::PaymentIntent).to receive(:create).and_return(
        {
          'id' => 'pi_test_123',
          'client_secret' => 'pi_test_123_secret_abc'
        }
      )
    end

    it 'creates payment intent successfully' do
      expect do
        post '/api/members/payment_intents', params: {
          total: 100.00,
          amount: 100.00
        }, as: :json
      end.to change(PaymentIntent, :count).by(1)

      payment_intent = PaymentIntent.last
      expect(payment_intent.user).to eq(member)
      expect(payment_intent.season_id).to eq(season.id)
      expect(payment_intent.stripe_pi_id).to eq('pi_test_123')
      expect(payment_intent.amount).to eq(10000) # $100 in cents

      json_response = JSON.parse(response.body)
      expect(json_response['clientSecret']).to eq('pi_test_123_secret_abc')
    end
  end

  describe 'Stripe webhook processes payment completion' do
    let(:member) { create(:user) }
    let!(:payment_schedule) { create(:payment_schedule, user: member, season: season) }
    let!(:payment_intent_record) do
      create(
        :payment_intent,
        user: member,
        season_id: season.id,
        stripe_pi_id: 'pi_test_456',
        amount: 15000 # $150
      )
    end

    before do
      create(:seasons_user, user: member, season: season, role: 'member')
      stripe_payment_type # Ensure Stripe payment type exists

      # Stub Stripe webhook signature verification
      allow(Stripe::Webhook).to receive(:construct_event).and_return(
        double(
          type: 'payment_intent.succeeded',
          data: double(
            object: {
              'id' => 'pi_test_456',
              'metadata' => double(
                charge_type: 'dues_payment',
                respond_to?: ->(method) { method == :charge_type }
              )
            }
          )
        )
      )
    end

    it 'creates payment record when webhook received' do
      expect do
        post '/stripe/webhook', params: {}, as: :json
      end.to change(Payment, :count).by(1)

      payment = Payment.last
      expect(payment.user).to eq(member)
      expect(payment.season).to eq(season)
      expect(payment.amount).to eq(15000)
      expect(payment.payment_type.name).to eq('Stripe')
      expect(payment.notes).to include('pi_test_456')

      expect(response).to have_http_status(:success)
    end
  end

  describe 'Admin manually enters payment' do
    let!(:admin) { sign_in_as_admin(season: season) }
    let(:member) { create(:user) }
    let!(:payment_schedule) { create(:payment_schedule, user: member, season: season) }

    before do
      create(:seasons_user, user: member, season: season, role: 'member')
      cash_payment_type
      # Stub activity logger
      allow(ActivityLogger).to receive(:log_payment)
    end

    it 'creates cash payment successfully' do
      expect do
        post '/admin/payments', params: {
          payment: {
            user_id: member.id,
            amount: 200.00, # Dollars (will be converted to cents)
            date_paid: Date.today,
            payment_type_id: cash_payment_type.id,
            notes: 'Cash payment at rehearsal'
          }
        }
      end.to change(Payment, :count).by(1)

      payment = Payment.last
      expect(payment.user).to eq(member)
      expect(payment.season).to eq(season)
      expect(payment.amount).to eq(20000) # Converted to cents
      expect(payment.payment_type).to eq(cash_payment_type)
      expect(payment.notes).to eq('Cash payment at rehearsal')

      expect(response).to redirect_to(admin_payments_path)
      expect(flash[:success]).to match(/created/)
    end

    it 'can view all payments for season' do
      create(:payment, user: member, season: season, payment_type: cash_payment_type)

      get '/admin/payments', as: :json

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response['payments']).to be_present
    end

    it 'can edit existing payment' do
      payment = create(
        :payment,
        user: member,
        season: season,
        payment_type: cash_payment_type,
        amount: 10000
      )

      get "/admin/payments/#{payment.id}/edit"

      expect(response).to have_http_status(:success)
    end
  end
end
