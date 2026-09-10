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
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.today + 1.month, amount: 5000)
      create(:payment, user: user, season: season, amount: 4000, date_paid: Date.today)

      results = described_class.behind_members(season.id)

      expect(results).to contain_exactly(
        hash_including(
          id: user.id, name: 'Dana Evers',
          paid_cents: 4000, past_due_cents: 6000, season_total_cents: 15_000
        )
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

  describe 'burndown series' do
    let(:user) { create(:user) }
    let(:schedule) { create(:payment_schedule, season: season, user: user) }

    # Anchor to fixed Sundays so the weekly sampling is deterministic.
    let(:week1) { Date.new(2026, 1, 4) }  # Sunday
    let(:week3) { Date.new(2026, 1, 18) } # Sunday

    before do
      create(:seasons_user, user: user, season: season, role: 'member')
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: week1 + 1.day, amount: 30_000)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: week3 + 1.day, amount: 20_000)
    end

    describe '.season_scheduled_series' do
      it 'samples cumulative scheduled dues weekly on Sundays' do
        series = described_class.season_scheduled_series(season.id)

        expect(series.map(&:first)).to include('2026-01-04', '2026-01-11', '2026-01-18')
        expect(series.first).to eq(['2026-01-04', 0.0])
        expect(series.find { |d, _| d == '2026-01-11' }.last).to eq(300.0)
        expect(series.last.last).to eq(500.0)
      end

      it 'scopes to the season passed in, not Season.last' do
        other = create(:season, year: '2099')
        other_user = create(:user)
        create(:seasons_user, user: other_user, season: other, role: 'member')
        other_schedule = create(:payment_schedule, season: other, user: other_user)
        create(:payment_schedule_entry, payment_schedule: other_schedule, pay_date: week1 + 1.day, amount: 99_999)

        series = described_class.season_scheduled_series(season.id)

        expect(series.map(&:last)).not_to include(999.99)
      end

      it 'is empty for a season with no schedule entries' do
        expect(described_class.season_scheduled_series(create(:season, year: '2088').id)).to eq([])
      end
    end

    describe '.season_actual_series' do
      # Regression: the frame appends the last due date so the SCHEDULED line
      # reaches it. That point is not a Sunday and is often after today —
      # letting it into the actual series put the collected line past today and
      # made the chart's shortfall disagree with the "expected by today" stat.
      it 'ends at today, never at the trailing last-due-date point' do
        late = create(:season, year: '2031')
        lu = create(:user)
        create(:seasons_user, user: lu, season: late, role: 'member')
        ls = create(:payment_schedule, season: late, user: lu)
        create(:payment_schedule_entry, payment_schedule: ls, pay_date: Date.current - 20.days, amount: 10_000)
        create(:payment_schedule_entry, payment_schedule: ls, pay_date: Date.current + 40.days, amount: 10_000)

        series = described_class.season_actual_series(late.id)

        expect(series.last.first).to eq(Date.current.iso8601)
        expect(series.map(&:first)).to all(be <= Date.current.iso8601)
      end

      it 'agrees with total_dues_owed_to_date at today' do
        agree = create(:season, year: '2032')
        au = create(:user)
        create(:seasons_user, user: au, season: agree, role: 'member')
        as = create(:payment_schedule, season: agree, user: au)
        # One installment before the last Sunday, one between it and today.
        last_sunday = Date.current - Date.current.wday
        create(:payment_schedule_entry, payment_schedule: as, pay_date: last_sunday - 14.days, amount: 30_000)
        create(:payment_schedule_entry, payment_schedule: as, pay_date: last_sunday + 1.day, amount: 20_000) if
          last_sunday + 1.day <= Date.current
        create(:payment, user: au, season: agree, amount: 32_500, date_paid: last_sunday - 10.days)

        sched = described_class.season_scheduled_series(agree.id)
        actual = described_class.season_actual_series(agree.id)
        at_today = ->(s) { s.select { |d, _| d <= Date.current.iso8601 }.last.last }

        expect((at_today.call(sched) * 100).round).to eq(PaymentService.total_dues_owed_to_date(agree.id))
        expect((at_today.call(actual) * 100).round).to eq(PaymentService.total_dues_paid_to_date(agree.id))
      end

      it 'is empty when every scheduled Sunday is still in the future' do
        future = create(:season, year: '2099')
        fu = create(:user)
        create(:seasons_user, user: fu, season: future, role: 'member')
        fs = create(:payment_schedule, season: future, user: fu)
        create(:payment_schedule_entry, payment_schedule: fs, pay_date: Date.new(2099, 1, 4), amount: 10_000)

        expect(described_class.season_actual_series(future.id)).to eq([])
      end

      it 'accumulates non-deleted payments and stops at today' do
        create(:payment, user: user, season: season, amount: 10_000, date_paid: week1 + 2.days)
        deleted = create(:payment, user: user, season: season, amount: 5000, date_paid: week1 + 2.days)
        deleted.destroy

        series = described_class.season_actual_series(season.id)

        expect(series.map(&:first).max).to be <= Date.current.iso8601
        expect(series.find { |d, _| d == '2026-01-11' }&.last).to eq(100.0)
      end
    end
  end

  describe '.average_days_late' do
    let(:user) { create(:user) }
    let(:schedule) { create(:payment_schedule, season: season, user: user) }

    before { create(:seasons_user, user: user, season: season, role: 'member') }

    it 'averages the lag between a past-due entry and the payment that covered it' do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 20.days, amount: 10_000)
      create(:payment, user: user, season: season, amount: 10_000, date_paid: Date.current - 10.days)

      expect(described_class.average_days_late(season.id)).to eq(10)
    end

    it 'counts an uncovered past-due entry as late through today' do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 8.days, amount: 10_000)

      expect(described_class.average_days_late(season.id)).to eq(8)
    end

    it 'returns nil when nothing is past due' do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current + 10.days, amount: 10_000)

      expect(described_class.average_days_late(season.id)).to be_nil
    end
  end
end
