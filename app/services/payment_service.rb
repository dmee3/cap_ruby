# frozen_string_literal: true

class PaymentService
  DUES_PERIODS = [
    { start: '2022-10-23', end: '2022-11-26' },
    { start: '2022-11-27', end: '2022-12-29' },
    { start: '2022-12-30', end: '2023-01-21' },
    { start: '2022-01-22', end: '2023-02-18' },
    { start: '2022-02-19', end: '2023-03-18' },
    { start: '2022-03-19', end: '2023-10-01' }
  ]

  class << self
    def season_payment_details(season_id)
      User
        .includes(:payments, payment_schedules: :payment_schedule_entries)
        .members_for_season(season_id)
    end

    def payments_collected_to_date(season_id)
      Payment.for_season(season_id)
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

    def total_dues_owed_to_date(season_id)
      PaymentScheduleEntry
        .for_season(season_id)
        .where(pay_date: Date.strptime('2000-01-01')..Date.today)
        .sum(&:amount)
    end

    def total_dues_paid_to_date(season_id)
      Payment.for_season(season_id).sum(&:amount)
    end

    def dues_owed_in_current_period(season_id)
      schedules = User.members_for_season(season_id).map { |m| m.remaining_payments_for(season_id) }
      return 0 if schedules.blank?

      current_entries = schedules.flatten.filter do |s|
        s[:pay_date] <= Date.parse(current_dues_period[:end])
      end
      current_entries.sum { |e| e[:amount] }
    end

    def dues_paid_in_current_period(season_id)
      period_start = Date.parse(current_dues_period[:start])
      period_end = Date.parse(current_dues_period[:end])
      Payment.for_season(season_id).where(date_paid: period_start...period_end).sum(&:amount)
    end

    def current_dues_period
      DUES_PERIODS.filter { |p| Date.parse(p[:end]) >= Date.today }.first
    end
  end
end
