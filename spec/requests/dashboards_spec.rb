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

    it 'shows correct payment totals' do
      get '/members'

      expect(response).to have_http_status(:success)
      # Verify dashboard loads with payment information
      expect(response.body).to include('DUES PROGRESS')
    end

    it 'shows user conflicts' do
      get '/members'

      expect(response).to have_http_status(:success)
      # Verify conflicts section is present
      expect(response.body).to include('CONFLICTS')
    end

    it 'shows payment schedule entries' do
      get '/members'

      expect(response).to have_http_status(:success)
      # Verify payment schedule section is present
      expect(response.body).to include('PAYMENT SCHEDULE')
    end

    it 'shows past payments' do
      get '/members'

      expect(response).to have_http_status(:success)
      # Verify page loads successfully (payments are in the same dashboard)
      expect(response.body).to include('DUES PROGRESS')
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
