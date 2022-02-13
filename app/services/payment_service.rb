# frozen_string_literal: true

class PaymentService
  DUES_PERIODS = [
    { start: '2021-12-17', end: '2022-01-13' },
    { start: '2022-01-14', end: '2022-02-17' },
    { start: '2022-02-18', end: '2022-03-17' },
    { start: '2022-03-18', end: '2022-10-01' }
  ]

  class << self
    def season_payment_details(season_id)
      User
        .includes(:payments, payment_schedules: :payment_schedule_entries)
        .members_for_season(season_id)
    end

    # rubocop:disable Metrics/AbcSize, Metrics/MethodLength, Lint/UnexpectedBlockArity
    def upcoming_payments(start_date, end_date, season_id)
      entries = PaymentScheduleEntry
                .for_season(season_id)
                .includes(payment_schedule: { user: :payments })
                .where(pay_date: start_date..end_date)

      entry_data = entries.map do |e|
        {
          id: e.id,
          scheduled: e.schedule.scheduled_to_date(e.pay_date),
          paid: e.schedule.user.amount_paid_for(season_id),
          current_amount: e.amount,
          date: e.pay_date,
          name: e.schedule.user.full_name,
          user_id: e.schedule.user.id
        }
      end
      entry_data.select { |e| (e[:scheduled] - e[:paid]).positive? }.sort { |e| e[:date] }
    end
    # rubocop:enable Metrics/AbcSize, Metrics/MethodLength, Lint/UnexpectedBlockArity

    def amount_owed_on_date(user, date, season_id)
      schedule = user.payment_schedule_for(season_id)
      return 0 unless schedule.present?

      owed = schedule.entries.select { |e| e.pay_date <= date }.sum(&:amount)
      paid = user.payments_for(season_id).sum(&:amount)
      (owed - paid) / 100.0
    end

    def dues_period_breakdown(season_id)
      period_start = Date.parse(current_dues_period[:start])
      period_end = Date.parse(current_dues_period[:end])

      schedules = User.members_for_season(season_id).map { |m| m.remaining_payments_for(season_id) }
      current_entries = schedules.flatten.filter do |s|
        s[:pay_date] >= period_start && s[:pay_date] <= period_end
      end
      total_due = current_entries.sum { |e| e[:amount] }
      total_paid = Payment.for_season(season_id).where(date_paid: period_start...period_end).sum(&:amount)
      [total_due, total_paid]
    end

    def current_dues_period
      DUES_PERIODS.filter { |p| Date.parse(p[:end]) >= Date.today }.first
    end
  end
end
