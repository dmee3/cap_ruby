# frozen_string_literal: true

# rubocop:disable Metrics/AbcSize
class DashboardUtilities
  class << self
    def upcoming_payments(start_date, end_date, season_id)
      schedules = PaymentSchedule.for_season(season_id)
                                 .includes(:payment_schedule_entries, user: :payments)

      schedules = schedules.select do |s|
        s.entries.any? { |e| e.pay_date.between?(start_date, end_date) }
      end

      [].tap do |array|
        schedules.each do |sched|
          entry = sched.entries.sort_by(&:pay_date).find { |e| e.pay_date >= start_date }
          balance = sched.scheduled_to_date(entry.pay_date) - sched.user.amount_paid_for(season_id)
          next if balance <= 0 # Skip if they've paid ahead

          array << {
            pay_date: entry.pay_date.strftime('%-m/%-d/%y'),
            amount: balance.to_f / 100,
            user_id: sched.user_id,
            name: sched.user.full_name
          }
        end
      end
    end

    def recent_payments(start_date, end_date, season_id)
      Payment
        .for_season(season_id)
        .includes(:user)
        .where(date_paid: start_date..end_date)
        .map do |p|
          {
            amount: p.amount.to_f / 100,
            date_paid: p.date_paid.strftime('%-m/%-d/%y'),
            id: p.id,
            name: "#{p.user.first_name} #{p.user.last_name}",
            payment_type: p.payment_type.name,
            user_id: p.user.id
          }
        end
    end

    def upcoming_conflicts(start_date, end_date, season_id)
      conflicts = Conflict.includes(:user, :conflict_status)
                          .for_season(season_id)
                          .where(start_date: start_date..end_date)
                          .order(:start_date)

      conflicts.map do |c|
        {
          start_date: c.start_date,
          end_date: c.end_date,
          name: c.user.full_name,
          status: c.conflict_status.name
        }
      end
    end

    # Members whose payments haven't caught up to what their schedule says is
    # owed by today. `past_due_cents` and the "members behind" count both key off
    # PaymentService.amount_owed_on_date so the dashboard, the list, and each
    # member's Member 360 figure agree.
    def behind_members(season_id)
      members = User.for_season(season_id).with_payments.with_role_for_season('member', season_id).to_a
      members.filter_map do |m|
        past_due = PaymentService.amount_owed_on_date(m, Date.current, season_id)
        next if past_due <= 0

        schedule = m.payment_schedule_for(season_id)
        {
          id: m.id,
          name: m.full_name,
          paid_cents: m.amount_paid_for(season_id),
          season_total_cents: schedule&.entries&.sum(&:amount).to_i,
          past_due_cents: (past_due * 100).round
        }
      end
    end

    # Cumulative "dues owed by date" (sum of every member's own schedule
    # entries) vs. "dues collected by date" (sum of non-deleted payments),
    # sampled weekly on Sundays from the first scheduled due date to the last.
    # The collected series stops at today — it never returns to zero.
    def season_scheduled_series(season_id)
      sundays, entries, = burndown_frame(season_id)
      return [] if sundays.empty?

      cumulative_series(sundays, entries, :pay_date)
    end

    def season_actual_series(season_id)
      sundays, _entries, payments = burndown_frame(season_id)
      return [] if sundays.empty?

      today = Date.current
      cumulative_series(sundays.select { |d| d <= today }, payments, :date_paid)
    end

    # For the dashboard stat: average number of days a past-due schedule entry
    # went uncovered, across the season. Returns nil when nothing is past due.
    def average_days_late(season_id)
      schedules = PaymentSchedule.for_season(season_id)
                                 .includes(:payment_schedule_entries, user: :payments)
      lags = schedules.flat_map { |sched| entry_lags(sched, season_id) }
      return nil if lags.empty?

      (lags.sum.to_f / lags.length).round
    end

    private

    # Load everything once; the burndown then buckets in Ruby.
    def burndown_frame(season_id)
      entries = PaymentScheduleEntry.for_season(season_id).to_a.sort_by(&:pay_date)
      payments = Payment.for_season(season_id).to_a.sort_by(&:date_paid)
      return [[], entries, payments] if entries.empty?

      # Floor the start to the Sunday on/before the first due date so the chart
      # has a $0 baseline; cap the end at the last due date.
      first = entries.first.pay_date
      last = entries.last.pay_date
      start = first - first.wday
      sundays = (start..last).select { |d| d.wday.zero? }
      sundays << last unless sundays.last == last
      [sundays, entries, payments]
    end

    def cumulative_series(sample_dates, records, date_attr)
      sample_dates.map do |d|
        cents = records.take_while { |r| r.public_send(date_attr) <= d }.sum(&:amount)
        [d.iso8601, (cents.to_f / 100).round(2)]
      end
    end

    # For one member's schedule: for each past-due entry, how many days passed
    # between the entry's due date and the day the member's running payment
    # total first covered the cumulative amount scheduled through that entry.
    # An entry never covered as of today counts its lag through today.
    def entry_lags(schedule, season_id)
      today = Date.current
      due_entries = schedule.entries.select { |e| e.pay_date < today }.sort_by(&:pay_date)
      return [] if due_entries.empty?

      payments = schedule.user.payments_for(season_id).sort_by(&:date_paid)
      running_scheduled = 0
      due_entries.map do |entry|
        running_scheduled += entry.amount
        covered_on = date_running_total_reaches(payments, running_scheduled)
        effective = covered_on && covered_on <= today ? covered_on : today
        [(effective - entry.pay_date).to_i, 0].max
      end
    end

    def date_running_total_reaches(payments, target_cents)
      running = 0
      payments.each do |payment|
        running += payment.amount
        return payment.date_paid if running >= target_cents
      end
      nil
    end
  end
end
# rubocop:enable Metrics/AbcSize
