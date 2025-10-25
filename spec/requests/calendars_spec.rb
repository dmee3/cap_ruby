# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Calendar Fundraiser Public Donations', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:member) { create(:user) }

  before do
    create(:seasons_user, user: member, season: season, role: 'member')
  end

  describe 'Public donation page (unauthenticated)' do
    it 'allows unauthenticated users to view donation page' do
      get '/calendars/new'

      expect(response).to have_http_status(:success)
    end

    it 'returns list of members for selection' do
      get '/calendars/members'

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response).to be_an(Array)
      expect(json_response.map { |m| m['id'] }).to include(member.id)
    end
  end

  describe 'Creating calendar payment intent (unauthenticated)' do
    before do
      # Stub Stripe API
      allow(Stripe::PaymentIntent).to receive(:create).and_return(
        {
          'id' => 'pi_calendar_123',
          'client_secret' => 'pi_calendar_123_secret_abc'
        }
      )
    end

    it 'creates payment intent without authentication' do
      post '/api/calendars/payment_intents', params: {
        total: 15, # $15 for 3 dates at $5 each
        dates: [1, 2, 3],
        donor_name: 'John Doe',
        member_id: member.id
      }, as: :json

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response['clientSecret']).to eq('pi_calendar_123_secret_abc')

      # Verify Stripe was called with correct params
      expect(Stripe::PaymentIntent).to have_received(:create).with(
        amount: 1500, # $15 in cents
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          charge_type: 'calendar',
          dates: '1,2,3',
          donor_name: 'John Doe',
          member_id: member.id
        }
      )
    end
  end

  describe 'Webhook processes calendar donation' do
    let!(:fundraiser) do
      Calendar::Fundraiser.create!(
        user: member,
        season: season
      )
    end

    before do
      # Stub email delivery
      allow(CalendarMailer).to receive_message_chain(:with, :calendar_email, :deliver_later)

      # Stub Stripe webhook signature verification
      allow(Stripe::Webhook).to receive(:construct_event).and_return(
        double(
          type: 'payment_intent.succeeded',
          data: double(
            object: {
              'id' => 'pi_calendar_456',
              'metadata' => double(
                charge_type: 'calendar',
                dates: '5,10,15',
                donor_name: 'Jane Smith',
                member_id: member.id.to_s,
                respond_to?: ->(method) { method == :charge_type }
              )
            }
          )
        )
      )
    end

    it 'creates calendar donation records when webhook received' do
      expect do
        post '/stripe/webhook', params: {}, as: :json
      end.to change(Calendar::Donation, :count).by(3)

      donations = Calendar::Donation.last(3)
      expect(donations.map(&:donation_date)).to match_array([5, 10, 15])
      expect(donations.map(&:donor_name).uniq).to eq(['Jane Smith'])
      expect(donations.map(&:user_id).uniq).to eq([member.id])
      expect(donations.map(&:amount)).to match_array([500, 1000, 1500]) # Dates * 100 cents

      expect(response).to have_http_status(:success)
    end

    it 'sends email notification to member after donation' do
      post '/stripe/webhook', params: {}, as: :json

      expect(CalendarMailer).to have_received(:with).with(
        user_id: member.id.to_s,
        donation_dates: [5, 10, 15],
        donor_name: 'Jane Smith'
      )
    end
  end

  describe 'Member views their fundraiser status' do
    let!(:fundraiser) do
      Calendar::Fundraiser.create!(
        user: member,
        season: season
      )
    end
    let!(:donation1) do
      Calendar::Donation.create!(
        user: member,
        season_id: season.id,
        calendar_fundraiser_id: fundraiser.id,
        donation_date: 1,
        amount: 100,
        donor_name: 'Donor One'
      )
    end
    let!(:donation2) do
      Calendar::Donation.create!(
        user: member,
        season_id: season.id,
        calendar_fundraiser_id: fundraiser.id,
        donation_date: 2,
        amount: 200,
        donor_name: 'Donor Two'
      )
    end

    before do
      sign_in member
      cookies[:cap_season_id] = season.id
      # Member needs payment schedule to view any member pages
      payment_schedule = create(:payment_schedule, user: member, season: season)
      create(:payment_schedule_entry, payment_schedule: payment_schedule, pay_date: 1.week.from_now)
    end

    it 'shows member their fundraiser donations' do
      get '/members/calendars'

      expect(response).to have_http_status(:success)
    end

    it 'returns donated dates for member via API' do
      get "/calendars?user_id=#{member.id}"

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response).to match_array([1, 2])
    end
  end
end
