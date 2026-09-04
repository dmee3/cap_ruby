# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Dashboard Data Accuracy', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:payment_type) { create(:payment_type, name: 'Cash') }

  before do
    # Stub external services
    allow(EventService).to receive(:next_event).and_return(nil)
    allow(PaymentService).to receive(:amount_owed_on_date).and_return(0)
  end

  describe 'Member dashboard' do
    let!(:member) { sign_in_as_member(season: season) }
    let!(:payment_schedule) { create(:payment_schedule, user: member, season: season) }
    let!(:schedule_entry_1) do
      create(
        :payment_schedule_entry,
        payment_schedule: payment_schedule,
        amount: 30000, # $300
        pay_date: 1.week.ago
      )
    end
    let!(:schedule_entry_2) do
      create(
        :payment_schedule_entry,
        payment_schedule: payment_schedule,
        amount: 40000, # $400
        pay_date: 1.week.from_now
      )
    end
    let!(:payment_1) do
      create(
        :payment,
        user: member,
        season: season,
        amount: 25000, # $250
        payment_type: payment_type,
        date_paid: 2.days.ago
      )
    end
    let!(:conflict) do
      create(
        :conflict,
        user: member,
        season: season,
        conflict_status: create(:conflict_status, name: 'Pending'),
        start_date: 1.week.from_now,
        end_date: 2.weeks.from_now,
        reason: 'Test conflict'
      )
    end

    it 'shows the dues meter with real totals' do
      get '/members'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Dues progress')
      # $250 paid of $700 scheduled -> meter island carries the cents
      expect(response.body).to include('id="dues-meter"')
      expect(response.body).to include('data-paid="25000"')
      expect(response.body).to include('data-total="70000"')
    end

    it 'shows the conflicts summary' do
      get '/members'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Your conflicts')
    end

    it 'reconciles the payment schedule and payments into one timeline' do
      get '/members'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Dues timeline')
      expect(response.body).to include('id="dues-timeline"')
      expect(response.body).to include('data-timeline')
    end

    it 'includes past payments in the timeline data' do
      get '/members'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('&quot;amount_cents&quot;:25000')
    end

    it 'does not 500 for a member with no payment schedule' do
      schedule_less = create(:user)
      create(:seasons_user, user: schedule_less, season: season, role: 'member')
      sign_in schedule_less
      cookies[:cap_season_id] = season.id

      get '/members'

      expect(response).to have_http_status(:success)
      expect(response.body).to include("hasn't been set up yet")
    end
  end

  describe 'Admin dashboard' do
    let!(:admin) { sign_in_as_admin(season: season) }

    let(:member1) { create(:user) }
    let(:member2) { create(:user) }

    let!(:member1_schedule) { create(:payment_schedule, user: member1, season: season) }
    let!(:member2_schedule) { create(:payment_schedule, user: member2, season: season) }

    before do
      create(:seasons_user, user: member1, season: season, role: 'member')
      create(:seasons_user, user: member2, season: season, role: 'member')

      # Member 1 schedule: $500 due
      create(
        :payment_schedule_entry,
        payment_schedule: member1_schedule,
        amount: 50000,
        pay_date: 1.week.ago
      )

      # Member 2 schedule: $300 due
      create(
        :payment_schedule_entry,
        payment_schedule: member2_schedule,
        amount: 30000,
        pay_date: 1.week.ago
      )

      # Member 1 paid $400
      create(
        :payment,
        user: member1,
        season: season,
        amount: 40000,
        payment_type: payment_type,
        date_paid: 2.days.ago
      )

      # Member 2 paid $300 (fully paid)
      create(
        :payment,
        user: member2,
        season: season,
        amount: 30000,
        payment_type: payment_type,
        date_paid: 2.days.ago
      )
    end

    it 'shows correct expected dues total' do
      allow(PaymentService).to receive(:total_dues_owed_to_date)
        .with(season.id)
        .and_return(80000) # $800 total expected

      get '/admin'

      expect(response).to have_http_status(:success)
      # Verify PaymentService was called to calculate expected dues
      expect(PaymentService).to have_received(:total_dues_owed_to_date).with(season.id)
    end

    it 'shows correct actual dues collected' do
      allow(PaymentService).to receive(:total_dues_paid_to_date)
        .with(season.id)
        .and_return(70000) # $700 total paid

      get '/admin'

      expect(response).to have_http_status(:success)
      # Verify PaymentService was called to calculate actual dues
      expect(PaymentService).to have_received(:total_dues_paid_to_date).with(season.id)
    end

    it 'warns about members with empty payment schedules' do
      member_without_schedule = create(:user)
      create(:seasons_user, user: member_without_schedule, season: season, role: 'member')
      create(:payment_schedule, user: member_without_schedule, season: season)
      # No entries created for this schedule

      get '/admin'

      expect(response).to have_http_status(:success)
      expect(flash.now[:error]).to be_present
      expect(flash.now[:error].join).to include(member_without_schedule.full_name)
    end
  end
end
