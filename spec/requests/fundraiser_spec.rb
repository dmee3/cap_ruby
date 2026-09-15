# frozen_string_literal: true

require 'rails_helper'

# The public calendar fundraiser (Flow 7). Unauthenticated throughout: a donor
# arrives from a link someone shared, sponsors dates for one performer, and pays.
#
# The mechanic: the donation amount IS the date number, so the 3rd is $3 and the
# 17th is $17. 31 dates per performer, each claimable once, $496 when complete.
RSpec.describe 'Public fundraiser', type: :request do
  # Two seasons, so anything reading "the newest season" has something to get
  # wrong. The fundraiser is public, so it can't use `current_season`.
  let!(:old_season) { create(:season, year: 2025) }
  let!(:season) { create(:season, year: 2026) }

  let(:performer) do
    create(:user, first_name: 'Elena', last_name: 'Sokol').tap do |u|
      create(:seasons_user, user: u, season: season, role: 'member',
                            ensemble: 'World', section: 'Front Ensemble')
    end
  end

  def sponsor(user, date, season_for: season, name: 'The Sokol Family', intent: 'pi_test')
    fundraiser = Calendar::Fundraiser.create!(user: user, season: season_for)
    Calendar::Donation.create!(
      user: user, fundraiser: fundraiser, season_id: season_for.id,
      donation_date: date, amount: date * 100, donor_name: name,
      notes: "Stripe: #{intent}"
    )
  end

  describe 'the picker' do
    it 'renders for a logged-out visitor without the app shell' do
      performer

      get '/fundraiser'

      expect(response).to have_http_status(:success)
      expect(response.body).not_to include('class="app-sidebar"')
      expect(response.body).not_to include('app-drawer')
    end

    it 'leads with the mechanic, since that is the whole design problem' do
      performer

      get '/fundraiser'

      expect(response.body).to include('Pick a date. Donate that many dollars.')
      expect(response.body).to include("#{season.year} calendar fundraiser")
      expect(response.body).to include('our performers cover the cost of')
      expect(response.body).to include('keep performing')
    end

    it 'hands the performers to the widget as a JSON blob' do
      sponsor(performer, 3)

      get '/fundraiser'

      # data-* attributes, so `<%=` escaping is correct here (unlike a
      # window.foo = ... script tag, which needs the raw `<%==`).
      expect(response.body).to include('id="performer-picker"')
      expect(response.body).to include(performer.public_token)
      expect(response.body).to include('Front Ensemble')
    end

    it 'never names a month, because the tiles are prices not appointments' do
      performer

      get '/fundraiser'

      expect(response.body).not_to match(/March/i)
    end

    # A season exists for months before anyone starts a calendar, so this is a
    # real state rather than an edge case.
    it 'says so plainly when no one has started a calendar' do
      get '/fundraiser'

      expect(response).to have_http_status(:success)
      expect(response.body).to include("The calendar isn't open yet")
      expect(response.body).not_to include('id="performer-picker"')
    end
  end

  describe 'a performer page' do
    it 'is addressed by the opaque token, not the id or the name' do
      get "/fundraiser/#{performer.public_token}"

      expect(response).to have_http_status(:success)
      # The whole point of the token: the URL must not carry either.
      expect(performer.public_token).to be_present
      expect(performer.public_token).not_to include('elena')
      expect(performer.public_token).not_to eq(performer.id.to_s)
    end

    it 'is reachable by the short share link' do
      get "/f/#{performer.public_token}"

      expect(response).to have_http_status(:success)
    end

    it 'sends a stale or mistyped link back to the picker instead of erroring' do
      get '/fundraiser/nosuchtoken'

      expect(response).to redirect_to('/fundraiser')
    end
  end

  describe 'the date picker' do
    it 'leads with the performer and the mechanic in one line' do
      get "/fundraiser/#{performer.public_token}"

      expect(response.body).to include('Support Elena Sokol')
      expect(response.body).to include('The 3rd is $3, the 17th is $17.')
    end

    it 'hands the claimed dates to the grid' do
      sponsor(performer, 3)
      sponsor(performer, 17, intent: 'pi_other')

      get "/fundraiser/#{performer.public_token}"

      expect(response.body).to include('id="date-picker"')
      expect(response.body).to include('[3,17]')
    end

    it 'counts the dates still available' do
      sponsor(performer, 3)

      get "/fundraiser/#{performer.public_token}"

      expect(response.body).to include('30 dates left')
    end

    it 'names no month here either' do
      get "/fundraiser/#{performer.public_token}"

      expect(response.body).not_to match(/March/i)
    end
  end

  describe 'checkout' do
    it 'totals the picked dates' do
      get "/fundraiser/#{performer.public_token}/checkout?dates=3,12,17"

      expect(response).to have_http_status(:success)
      expect(response.body).to include('id="donation-checkout"')
      # 3 + 12 + 17 = $32, in cents.
      expect(response.body).to include('data-total-cents="3200"')
      expect(response.body).to include('[3,12,17]')
    end

    it 'sends a donor with no dates back to the grid' do
      get "/fundraiser/#{performer.public_token}/checkout"

      expect(response).to redirect_to("/fundraiser/#{performer.public_token}")
    end

    it 'ignores junk in the query string rather than charging for it' do
      get "/fundraiser/#{performer.public_token}/checkout?dates=3,0,99,abc,3"

      expect(response.body).to include('data-total-cents="300"')
      expect(response.body).to include('[3]')
    end

    # A date can go while the donor is on the grid deciding.
    it 'drops a date claimed since the donor picked it' do
      sponsor(performer, 12)

      get "/fundraiser/#{performer.public_token}/checkout?dates=3,12"

      expect(response.body).to include('data-total-cents="300"')
      expect(response.body).to include('[3]')
    end

    # Not a style point: this is the guard that keeps a development or test run
    # from putting a live publishable key on a public page.
    it 'reads the Stripe TEST key outside production, never the live one' do
      old_test = ENV.fetch('STRIPE_PUBLIC_TEST_KEY', nil)
      old_live = ENV.fetch('STRIPE_PUBLIC_KEY', nil)
      ENV['STRIPE_PUBLIC_TEST_KEY'] = 'pk_test_sentinel'
      ENV['STRIPE_PUBLIC_KEY'] = 'pk_live_should_never_appear'

      get "/fundraiser/#{performer.public_token}/checkout?dates=3"

      expect(response.body).to include('data-stripe-key="pk_test_sentinel"')
      expect(response.body).not_to include('pk_live_should_never_appear')
    ensure
      ENV['STRIPE_PUBLIC_TEST_KEY'] = old_test
      ENV['STRIPE_PUBLIC_KEY'] = old_live
    end
  end

  # The confirmation page reads the Stripe PaymentIntent rather than the
  # donation rows, because the webhook that writes those rows is a separate
  # async request that the donor can easily outrun.
  describe 'the confirmation page' do
    # Built as real Stripe objects, not Hashes. `expand: ['latest_charge']`
    # returns a Stripe::Charge, and a StripeObject supports [] and method
    # access but NOT dig — a Hash stub hid a live NoMethodError on this page.
    def stripe_intent(charge_attrs: {}, metadata: {})
      Stripe::PaymentIntent.construct_from(
        id: 'pi_ok',
        receipt_email: nil,
        metadata: {
          dates: '3,12,17', donor_name: 'The Sokol Family', member_id: performer.id.to_s
        }.merge(metadata),
        latest_charge: Stripe::Charge.construct_from(
          {
            id: 'ch_ok',
            created: Time.zone.parse('2026-03-14 12:00').to_i,
            payment_method_details: { card: { brand: 'visa', last4: '4242' } },
            billing_details: { email: 'j.sokol@example.com' }
          }.merge(charge_attrs)
        )
      )
    end

    let(:succeeded_intent) { stripe_intent }

    it 'shows the receipt from the intent, before the webhook has written anything' do
      allow(Stripe::PaymentIntent).to receive(:retrieve).and_return(succeeded_intent)

      expect(Calendar::Donation.count).to eq(0)

      get '/fundraiser/thanks?payment_intent=pi_ok&redirect_status=succeeded'

      expect(response).to have_http_status(:success)
      expect(response.body).to include("Elena's calendar just got fuller")
      expect(response.body).to include('The Sokol Family took the 3rd, 12th and 17th')
      # 3 + 12 + 17
      expect(response.body).to include('data-total-cents="3200"')
      expect(response.body).to include('j.sokol@example.com')
    end

    it 'offers the share link, which is what produces the next donation' do
      allow(Stripe::PaymentIntent).to receive(:retrieve).and_return(succeeded_intent)

      get '/fundraiser/thanks?payment_intent=pi_ok&redirect_status=succeeded'

      expect(response.body).to include('id="share-calendar"')
      expect(response.body).to include("/f/#{performer.public_token}")
    end

    it 'names a blank donor Anonymous rather than leaving a gap' do
      allow(Stripe::PaymentIntent).to receive(:retrieve)
        .and_return(stripe_intent(metadata: { donor_name: '' }))

      get '/fundraiser/thanks?payment_intent=pi_ok&redirect_status=succeeded'

      expect(response.body).to include('Anonymous took the 3rd, 12th and 17th')
    end

    # Stripe sandbox doesn't collect a billing email by default, so both
    # billing_details.email and receipt_email come back null. The receipt has
    # to render anyway and just omit the line.
    it 'renders without an email when Stripe has none' do
      allow(Stripe::PaymentIntent).to receive(:retrieve)
        .and_return(stripe_intent(charge_attrs: { billing_details: { email: nil } }))

      get '/fundraiser/thanks?payment_intent=pi_ok&redirect_status=succeeded'

      expect(response).to have_http_status(:success)
      expect(response.body).to include("Elena's calendar just got fuller")
      expect(response.body).to include('data-email=""')
    end

    # The webhook writes the donation rows and may not have landed when the
    # donor arrives, so counting only stored rows told someone who had just
    # given $32 that the performer still needed the whole $496.
    describe 'the share card figure' do
      it 'counts the donation just made, even before the webhook lands' do
        allow(Stripe::PaymentIntent).to receive(:retrieve).and_return(succeeded_intent)

        expect(Calendar::Donation.count).to eq(0)

        get '/fundraiser/thanks?payment_intent=pi_ok&redirect_status=succeeded'

        # 3 + 12 + 17 = $32 of $496, so $464 left, not $496.
        expect(response.body).to include('needs $464 more')
      end

      it 'does not double-count once the webhook has written those rows' do
        sponsor(performer, 3)
        sponsor(performer, 12, intent: 'pi_b')
        sponsor(performer, 17, intent: 'pi_c')
        allow(Stripe::PaymentIntent).to receive(:retrieve).and_return(succeeded_intent)

        get '/fundraiser/thanks?payment_intent=pi_ok&redirect_status=succeeded'

        expect(response.body).to include('needs $464 more')
      end

      it 'adds the new donation on top of earlier ones' do
        sponsor(performer, 31)
        allow(Stripe::PaymentIntent).to receive(:retrieve).and_return(succeeded_intent)

        get '/fundraiser/thanks?payment_intent=pi_ok&redirect_status=succeeded'

        # $31 already in + $32 just now = $63, so $433 left.
        expect(response.body).to include('needs $433 more')
      end
    end

    it 'carries no invented receipt number' do
      allow(Stripe::PaymentIntent).to receive(:retrieve).and_return(succeeded_intent)

      get '/fundraiser/thanks?payment_intent=pi_ok&redirect_status=succeeded'

      expect(response.body).not_to match(/#CC-/)
      expect(response.body).to include('data-charged-on="3/14/26"')
    end

    # Honest about the timing rather than inventing a receipt.
    it 'acknowledges the charge when the intent cannot be read back' do
      allow(Stripe::PaymentIntent).to receive(:retrieve)
        .and_raise(Stripe::APIConnectionError.new('down'))
      allow(Rollbar).to receive(:error)

      get '/fundraiser/thanks?payment_intent=pi_ok&redirect_status=succeeded'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Your donation went through')
      expect(response.body).not_to include('just got fuller')
    end

    # The canvas suggested a support address that doesn't exist. A dead mailto
    # on the one page an outsider ever sees is worse than no contact route, so
    # the failure screen sends people back to try again instead.
    it 'offers no invented support address' do
      get '/fundraiser/thanks?redirect_status=failed'

      expect(response.body).not_to include('mailto:')
      expect(response.body).not_to include('boosters@')
      expect(response.body).to include('Wait a few minutes and try again')
    end

    it 'says nothing was charged when the payment failed' do
      get '/fundraiser/thanks?payment_intent=pi_no&redirect_status=failed'

      expect(response).to have_http_status(:success)
      expect(response.body).to include("That didn't go through")
      expect(response.body).to include("wasn't charged and nobody's dates changed")
    end

    it 'treats a bare visit with no Stripe params as a failure, not a receipt' do
      get '/fundraiser/thanks'

      expect(response).to have_http_status(:success)
      expect(response.body).to include("That didn't go through")
    end
  end

  describe 'old shared links' do
    # These are on refrigerators and in group texts.
    it 'redirects the old donate page to the picker' do
      get '/calendars/new'

      expect(response).to have_http_status(:moved_permanently)
      expect(response).to redirect_to('/fundraiser')
    end

    it 'redirects the old Stripe return URL, keeping its query string' do
      get '/calendars/payment-confirmed?payment_intent=pi_123&redirect_status=succeeded'

      expect(response).to have_http_status(:moved_permanently)
      expect(response.headers['Location']).to include('/fundraiser/thanks')
      expect(response.headers['Location']).to include('payment_intent=pi_123')
    end
  end

  describe 'GET /api/fundraiser/performers' do
    it 'returns ensemble, section and progress in one request' do
      sponsor(performer, 3)
      sponsor(performer, 17, intent: 'pi_other')

      get '/api/fundraiser/performers'

      expect(response).to have_http_status(:success)
      body = response.parsed_body
      row = body['performers'].find { |p| p['token'] == performer.public_token }

      expect(row['name']).to eq('Elena Sokol')
      expect(row['initials']).to eq('ES')
      expect(row['section']).to eq('Front Ensemble')
      # $3 + $17, in cents, because the frontend money helpers take cents.
      expect(row['raised_cents']).to eq(2000)
      expect(row['claimed_count']).to eq(2)
      expect(row['complete']).to be(false)
      expect(body['total_dates']).to eq(31)
      expect(body['goal_cents']).to eq(49_600)
    end

    it 'marks a performer complete when all 31 dates are claimed' do
      fundraiser = Calendar::Fundraiser.create!(user: performer, season: season)
      (1..31).each do |date|
        Calendar::Donation.create!(
          user: performer, fundraiser: fundraiser, season_id: season.id,
          donation_date: date, amount: date * 100
        )
      end

      get '/api/fundraiser/performers'

      row = response.parsed_body['performers'].first
      expect(row['raised_cents']).to eq(49_600) # 1+2+...+31 = $496
      expect(row['complete']).to be(true)
    end

    it 'scopes to the newest season by year, not by id' do
      # A back-filled historical season gets the higher id, which is exactly
      # what `Season.last` got wrong.
      backfilled = create(:season, year: 2019)
      other = create(:user, first_name: 'Marcus', last_name: 'Webb')
      create(:seasons_user, user: other, season: backfilled, role: 'member')
      performer

      get '/api/fundraiser/performers'

      tokens = response.parsed_body['performers'].map { |p| p['token'] }
      expect(tokens).to include(performer.public_token)
      expect(tokens).not_to include(other.public_token)
    end

    it 'does not run a query per performer' do
      5.times do |n|
        u = create(:user, first_name: "Perf#{n}", last_name: 'Test')
        create(:seasons_user, user: u, season: season, role: 'member')
        sponsor(u, n + 1, intent: "pi_#{n}")
      end

      count = 0
      counter = lambda do |_name, _start, _finish, _id, payload|
        count += 1 unless payload[:name] == 'SCHEMA' || payload[:sql].start_with?('TRANSACTION')
      end

      ActiveSupport::Notifications.subscribed(counter, 'sql.active_record') do
        get '/api/fundraiser/performers'
      end

      # Roster + the two grouped aggregates + season lookup, not 5 more for the
      # per-performer donation sums.
      expect(count).to be < 12
    end
  end

  describe 'GET /api/fundraiser/performers/:token/dates' do
    it 'returns the claimed dates' do
      sponsor(performer, 3)
      sponsor(performer, 17, intent: 'pi_other')

      get "/api/fundraiser/performers/#{performer.public_token}/dates"

      expect(response).to have_http_status(:success)
      expect(response.parsed_body['claimed_dates']).to eq([3, 17])
    end

    it 'creates no fundraiser row, because a GET must not write' do
      # The endpoint this replaced called find_or_create_incomplete_for_user,
      # so opening the picker left an empty fundraiser behind every time.
      performer

      expect do
        get "/api/fundraiser/performers/#{performer.public_token}/dates"
      end.not_to change(Calendar::Fundraiser, :count)
    end

    it '404s an unknown token' do
      get '/api/fundraiser/performers/nosuchtoken/dates'

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/fundraiser/payment_intents' do
    before do
      allow(Stripe::PaymentIntent).to receive(:create).and_return(
        { 'id' => 'pi_calendar_123', 'client_secret' => 'pi_calendar_123_secret' }
      )
    end

    it 'derives the charge from the dates and ignores a client-sent total' do
      # The bug this replaces: `params[:total] * 100` was charged as sent, so a
      # crafted request paid $1 while the webhook, which reads `dates`,
      # credited the performer $31.
      post '/api/fundraiser/payment_intents', params: {
        token: performer.public_token, dates: [31], total: 1, donor_name: 'Someone'
      }, as: :json

      expect(response).to have_http_status(:success)
      expect(Stripe::PaymentIntent).to have_received(:create).with(
        hash_including(amount: 3100)
      )
    end

    it 'charges the sum of the dates with no fee added' do
      post '/api/fundraiser/payment_intents', params: {
        token: performer.public_token, dates: [3, 12, 17], donor_name: 'The Sokol Family'
      }, as: :json

      # $3 + $12 + $17 = $32 exactly. Donors are not charged a card fee.
      expect(Stripe::PaymentIntent).to have_received(:create).with(
        hash_including(amount: 3200)
      )
    end

    it 'passes the dates and performer to the webhook through the metadata' do
      post '/api/fundraiser/payment_intents', params: {
        token: performer.public_token, dates: [3, 17]
      }, as: :json

      expect(Stripe::PaymentIntent).to have_received(:create).with(
        hash_including(
          metadata: hash_including(charge_type: 'calendar', dates: '3,17', member_id: performer.id)
        )
      )
    end

    it 'stores a blank donor name as nil, because anonymous is a real choice' do
      post '/api/fundraiser/payment_intents', params: {
        token: performer.public_token, dates: [3], donor_name: ''
      }, as: :json

      expect(Stripe::PaymentIntent).to have_received(:create).with(
        hash_including(metadata: hash_including(donor_name: nil))
      )
    end

    it 'ignores dates outside 1..31 and de-duplicates' do
      post '/api/fundraiser/payment_intents', params: {
        token: performer.public_token, dates: [3, 3, 0, 32, 99, 17]
      }, as: :json

      expect(Stripe::PaymentIntent).to have_received(:create).with(
        hash_including(amount: 2000, metadata: hash_including(dates: '3,17'))
      )
    end

    it 'rejects an empty selection without calling Stripe' do
      post '/api/fundraiser/payment_intents', params: {
        token: performer.public_token, dates: []
      }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(Stripe::PaymentIntent).not_to have_received(:create)
    end

    it 'refuses a date someone else already claimed, before charging the card' do
      sponsor(performer, 17)

      post '/api/fundraiser/payment_intents', params: {
        token: performer.public_token, dates: [3, 17]
      }, as: :json

      expect(response).to have_http_status(:conflict)
      expect(response.parsed_body['claimed_dates']).to eq([17])
      expect(response.parsed_body['available_dates']).to eq([3])
      expect(Stripe::PaymentIntent).not_to have_received(:create)
    end
  end

  # The donor types their name after the Payment Element has mounted, and the
  # webhook reads the byline off the intent's metadata, so it's attached just
  # before the card is confirmed.
  describe 'PATCH /api/fundraiser/payment_intents/:id' do
    let(:calendar_intent) do
      { id: 'pi_1', status: 'requires_payment_method', metadata: { charge_type: 'calendar' } }
    end

    before do
      allow(Stripe::PaymentIntent).to receive(:retrieve).and_return(calendar_intent)
      allow(Stripe::PaymentIntent).to receive(:update)
    end

    it 'attaches the donor name to the intent' do
      patch '/api/fundraiser/payment_intents/pi_1', params: { donor_name: 'The Sokol Family' },
                                                    as: :json

      expect(response).to have_http_status(:no_content)
      expect(Stripe::PaymentIntent).to have_received(:update).with(
        'pi_1', metadata: { donor_name: 'The Sokol Family' }
      )
    end

    it 'stores a blank name as nil, so the receipt can say Anonymous' do
      patch '/api/fundraiser/payment_intents/pi_1', params: { donor_name: '' }, as: :json

      expect(Stripe::PaymentIntent).to have_received(:update).with(
        'pi_1', metadata: { donor_name: nil }
      )
    end

    # The endpoint is public, so it must not be usable to rewrite the metadata
    # of a dues payment or anything else that isn't this flow.
    it 'refuses an intent that is not a calendar donation' do
      allow(Stripe::PaymentIntent).to receive(:retrieve).and_return(
        { id: 'pi_dues', status: 'requires_payment_method',
          metadata: { charge_type: 'dues_payment' } }
      )

      patch '/api/fundraiser/payment_intents/pi_dues', params: { donor_name: 'Nope' }, as: :json

      expect(response).to have_http_status(:not_found)
      expect(Stripe::PaymentIntent).not_to have_received(:update)
    end

    it 'refuses an intent that has already been paid' do
      allow(Stripe::PaymentIntent).to receive(:retrieve).and_return(
        { id: 'pi_1', status: 'succeeded', metadata: { charge_type: 'calendar' } }
      )

      patch '/api/fundraiser/payment_intents/pi_1', params: { donor_name: 'Too late' }, as: :json

      expect(response).to have_http_status(:conflict)
      expect(Stripe::PaymentIntent).not_to have_received(:update)
    end

    it 'never fails the donation over a byline' do
      allow(Stripe::PaymentIntent).to receive(:retrieve)
        .and_raise(Stripe::InvalidRequestError.new('no such intent', 'id'))
      allow(Rollbar).to receive(:warning)

      patch '/api/fundraiser/payment_intents/pi_gone', params: { donor_name: 'X' }, as: :json

      expect(response).to have_http_status(:no_content)
    end
  end
end
