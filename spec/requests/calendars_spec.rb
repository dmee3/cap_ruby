# frozen_string_literal: true

require 'rails_helper'

# The calendar-donation WRITE path: the Stripe webhook, which is the only thing
# that persists a donation, plus the member's own view of what came in.
#
# The public donate screens themselves moved to /fundraiser in Flow 7 and are
# covered by spec/requests/fundraiser_spec.rb — the four specs here that drove
# /calendars/new, /calendars/members, /calendars?user_id= and the old payment
# intent endpoint went with them rather than being rewritten twice.
RSpec.describe 'Calendar Fundraiser donations', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:member) { create(:user) }

  before do
    create(:seasons_user, user: member, season: season, role: 'member')
  end

  # Built from real Stripe classes rather than doubles. A double with method
  # access can't reproduce the two things that actually bite here: Stripe omits
  # metadata keys whose value is nil, and StripeObject raises NoMethodError on
  # a missing key instead of returning nil.
  def stripe_event(intent_id, charge_type: 'calendar', **metadata)
    Stripe::Event.construct_from(
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: intent_id,
          metadata: { charge_type: charge_type }.merge(metadata.compact)
        }
      }
    )
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
        stripe_event('pi_calendar_456', dates: '5,10,15', donor_name: 'Jane Smith',
                                        member_id: member.id.to_s)
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

    # Stripe retries a webhook it didn't get a 2xx for, so the same event can
    # arrive twice. "Stripe: <pi_id>" on the notes is the idempotency key.
    it 'creates no duplicate rows and sends no second email on a redelivery' do
      post '/stripe/webhook', params: {}, as: :json

      expect do
        post '/stripe/webhook', params: {}, as: :json
      end.not_to change(Calendar::Donation, :count)

      expect(CalendarMailer).to have_received(:with).once
    end
  end

  # A donor who leaves the name blank is choosing to be anonymous. Storing ''
  # would leave the performer's email and the receipt with an empty byline.
  describe 'an anonymous donation' do
    let!(:fundraiser) { Calendar::Fundraiser.create!(user: member, season: season) }

    before do
      allow(CalendarMailer).to receive_message_chain(:with, :calendar_email, :deliver_later)
      # An anonymous donor: the intent endpoint sends donor_name: nil, and
      # Stripe DROPS nil metadata keys, so the key is absent entirely. That
      # crashed the webhook when it used method access (StripeObject raises
      # NoMethodError on a missing key), so the stub must omit it too.
      allow(Stripe::Webhook).to receive(:construct_event).and_return(
        stripe_event('pi_anon_1', dates: '7', member_id: member.id.to_s)
      )
    end

    it 'still records the donation' do
      # The regression: this 500'd with NoMethodError and wrote nothing, so an
      # anonymous donor was charged and the performer got no credit.
      expect do
        post '/stripe/webhook', params: {}, as: :json
      end.to change(Calendar::Donation, :count).by(1)

      expect(response).to have_http_status(:success)
    end

    it 'stores a blank donor name as nil' do
      post '/stripe/webhook', params: {}, as: :json

      expect(Calendar::Donation.last.donor_name).to be_nil
    end

    it 'still emails the performer' do
      post '/stripe/webhook', params: {}, as: :json

      expect(CalendarMailer).to have_received(:with).with(
        user_id: member.id.to_s, donation_dates: [7], donor_name: nil
      )
    end
  end

  # Stripe sends many event types to one endpoint; only the payment ones are
  # ours to act on.
  describe 'an event type the app does not handle' do
    before do
      allow(Stripe::Webhook).to receive(:construct_event).and_return(
        Stripe::Event.construct_from(
          type: 'customer.created',
          data: { object: { id: 'cus_1' } }
        )
      )
      allow(Rollbar).to receive(:info)
    end

    it 'acknowledges it without writing anything' do
      expect do
        post '/stripe/webhook', params: {}, as: :json
      end.not_to change(Calendar::Donation, :count)

      expect(response).to have_http_status(:success)
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
  end
end
