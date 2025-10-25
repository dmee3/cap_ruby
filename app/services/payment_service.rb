# frozen_string_literal: true
# typed: true

class PaymentService
  extend T::Sig
  DUES_PERIODS = [
    { start: '2025-10-17', end: '2025-11-13' },
    { start: '2025-11-14', end: '2025-12-11' },
    { start: '2025-12-12', end: '2026-01-08' },
    { start: '2026-01-09', end: '2026-02-05' },
    { start: '2026-02-06', end: '2026-03-05' },
    { start: '2026-03-06', end: '2026-04-16' }
  ].freeze

  class << self
    extend T::Sig

    sig { params(season_id: Integer).returns(ActiveRecord::Relation) }
    def season_payment_details(season_id)
      User
        .includes(:payments, payment_schedules: :payment_schedule_entries)
        .members_for_season(season_id)
    end

    sig { params(season_id: Integer).returns(ActiveRecord::Relation) }
    def payments_collected_to_date(season_id)
      Payment.for_season(season_id)
    end

    # rubocop:disable Metrics/AbcSize, Metrics/MethodLength, Lint/UnexpectedBlockArity
    sig do
      params(
        start_date: T.any(Date, ActiveSupport::TimeWithZone),
        end_date: T.any(Date, ActiveSupport::TimeWithZone),
        season_id: Integer
      ).returns(T::Array[T::Hash[Symbol, T.untyped]])
    end
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

    sig { params(user: User, date: T.any(Date, ActiveSupport::TimeWithZone), season_id: Integer).returns(Float) }
    def amount_owed_on_date(user, date, season_id)
      schedule = user.payment_schedule_for(season_id)
      return 0.0 unless schedule.present?

      owed = schedule.entries.select { |e| e.pay_date <= date }.sum(&:amount)
      paid = user.payments_for(season_id).sum(&:amount)
      (owed - paid) / 100.0
    end

    sig { params(season_id: Integer).returns(Integer) }
    def total_dues_owed_to_date(season_id)
      PaymentScheduleEntry
        .for_season(season_id)
        .where(pay_date: Date.strptime('2000-01-01')..Date.today)
        .sum(&:amount)
    end

    sig { params(season_id: Integer).returns(Integer) }
    def total_dues_paid_to_date(season_id)
      Payment.for_season(season_id).sum(&:amount)
    end

    sig { params(season_id: Integer).returns(Integer) }
    def dues_owed_in_current_period(season_id)
      schedules = User.members_for_season(season_id).map { |m| m.remaining_payments_for(season_id) }
      return 0 if schedules.blank?

      current_entries = schedules.flatten.filter do |s|
        s[:pay_date] <= Date.parse(current_dues_period[:end])
      end
      current_entries.sum { |e| e[:amount] }
    end

    sig { params(season_id: Integer).returns(Integer) }
    def dues_paid_in_current_period(season_id)
      period_start = Date.parse(current_dues_period[:start])
      period_end = Date.parse(current_dues_period[:end])
      Payment.for_season(season_id).where(date_paid: period_start...period_end).sum(&:amount)
    end

    sig { returns(T::Hash[Symbol, String]) }
    def current_dues_period
      DUES_PERIODS.filter { |p| Date.parse(p[:end]) >= Date.today }.first
    end
  end
end
