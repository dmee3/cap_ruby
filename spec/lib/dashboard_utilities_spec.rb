# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DashboardUtilities do
  let(:season) { create(:season) }

  describe '.upcoming_payments' do
    let(:user) { create(:user, first_name: 'Ann', last_name: 'Otherton') }
    let(:schedule) { create(:payment_schedule, season: season, user: user) }

    before do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.today + 3.days, amount: 5000)
    end

    it 'includes members with an entry due in the window and an outstanding balance' do
      results = described_class.upcoming_payments(Date.today, Date.today + 1.week, season.id)

      expect(results).to contain_exactly(
        hash_including(user_id: user.id, name: 'Ann Otherton', amount: 50.0)
      )
    end

    it 'excludes members who have already paid at or beyond the upcoming amount' do
      create(:payment, user: user, season: season, amount: 5000, date_paid: Date.today)

      results = described_class.upcoming_payments(Date.today, Date.today + 1.week, season.id)

      expect(results).to be_empty
    end

    it 'excludes schedules with no entries due in the window' do
      results = described_class.upcoming_payments(Date.today + 2.weeks, Date.today + 3.weeks, season.id)

      expect(results).to be_empty
    end
  end

  describe '.recent_payments' do
    let(:user) { create(:user, first_name: 'Ben', last_name: 'Franklin') }

    it 'returns payments made within the date range for the season' do
      payment = create(:payment, user: user, season: season, amount: 2500, date_paid: Date.today)
      create(:payment, user: user, season: season, amount: 1000, date_paid: Date.today - 2.weeks)

      results = described_class.recent_payments(Date.today - 1.day, Date.today + 1.day, season.id)

      expect(results).to contain_exactly(
        hash_including(id: payment.id, amount: 25.0, name: 'Ben Franklin', user_id: user.id)
      )
    end

    it 'returns an empty array when no payments fall in range' do
      results = described_class.recent_payments(Date.today - 1.day, Date.today + 1.day, season.id)

      expect(results).to eq([])
    end
  end

  describe '.upcoming_conflicts' do
    let(:user) { create(:user, first_name: 'Cara', last_name: 'Diaz') }
    let(:status) { create(:conflict_status, name: 'Pending') }

    it 'returns conflicts for the season within the date range, ordered by start date' do
      later = create(:conflict, user: user, season: season, conflict_status: status,
                                start_date: Date.today + 5.days, end_date: Date.today + 6.days)
      earlier = create(:conflict, user: user, season: season, conflict_status: status,
                                  start_date: Date.today + 2.days, end_date: Date.today + 3.days)

      results = described_class.upcoming_conflicts(Date.today, Date.today + 1.week, season.id)

      expect(results.map { |c| c[:start_date] }).to eq([earlier, later].map(&:start_date))
      expect(results.first).to include(name: 'Cara Diaz', status: 'Pending')
    end
  end

  describe '.behind_members' do
    it 'includes members whose payments have not caught up to their schedule' do
      user = create(:user, first_name: 'Dana', last_name: 'Evers')
      create(:seasons_user, user: user, season: season, role: 'member')
      schedule = create(:payment_schedule, season: season, user: user)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.today - 1.day, amount: 10_000)
      create(:payment, user: user, season: season, amount: 4000, date_paid: Date.today)

      results = described_class.behind_members(season.id)

      expect(results).to contain_exactly(
        hash_including(id: user.id, name: 'Dana Evers', paid: 40.0, owed: 100.0)
      )
    end

    it 'excludes members who are paid up' do
      user = create(:user)
      create(:seasons_user, user: user, season: season, role: 'member')
      schedule = create(:payment_schedule, season: season, user: user)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.today - 1.day, amount: 10_000)
      create(:payment, user: user, season: season, amount: 10_000, date_paid: Date.today)

      results = described_class.behind_members(season.id)

      expect(results).to be_empty
    end

    it 'excludes users who are not members for the season' do
      user = create(:user)
      create(:seasons_user, user: user, season: season, role: 'coordinator')
      schedule = create(:payment_schedule, season: season, user: user)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.today - 1.day, amount: 10_000)

      results = described_class.behind_members(season.id)

      expect(results).to be_empty
    end
  end
end
