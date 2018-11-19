# rubocop:disable AbcSize
class DashboardUtilities
  class << self
    def payment_sums_by_week(season_id)
      all_payments = Payment.for_season(season_id).order(:date_paid)
      weekly_payments = all_payments.group_by { |payment, _| payment.date_paid.end_of_week }
      weekly_payments.map { |week, payments| [week, payments.sum(&:amount).round(2) / 100] }
    end

    def payment_schedule_sums_by_week(season_id)
      # Get all payment schedule entries for the season and set date to a Sunday
      entries = PaymentScheduleEntry.for_season(season_id).where('pay_date <= ?', Date.today).order(:pay_date)
      entries.each { |e| e.pay_date = e.pay_date.end_of_week }

      # Group entries by week and sum the amount
      {}.tap do |sums|
        entries.each do |e|
          sums[e.pay_date] = 0 unless sums[e.pay_date].present?
          sums[e.pay_date] += e.amount.round(2) / 100
        end
      end.to_a
    end

    # rubocop:disable Metrics/MethodLength
    def upcoming_payments(start_date, end_date, season_id)
      schedules = PaymentSchedule.for_season(season_id)
                                 .includes(:payment_schedule_entries, user: :payments)

      schedules = schedules.select do |s|
        s.entries.any? { |e| e.pay_date >= start_date && e.pay_date <= end_date }
      end

      [].tap do |array|
        schedules.each do |sched|
          entry = sched.entries.select { |e| e.pay_date >= start_date }.first
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
    # rubocop:enable Metrics/MethodLength

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

    def behind_members(season_id)
      members = User.for_season(season_id).with_payments.with_role(:member).to_a
      members.reject! { |m| m.dues_status_okay?(season_id) }
      members.map do |m|
        {
          name: m.full_name,
          paid: m.amount_paid_for(season_id).to_f / 100.0,
          owed: m.payment_schedule_for(season_id).scheduled_to_date.to_f / 100.0
        }
      end
    end

    def biweekly_scheduled
      season_id = Season.last.id
      entries = PaymentScheduleEntry.for_season(season_id).order(:pay_date)
      dates = (entries.first.pay_date..entries.last.pay_date).select { |d| d.wday.zero? }
      dates.map { |d| [d, entries.where('pay_date <= ?', d).sum(:amount).to_f / 100.0] }
    end

    def biweekly_actual
      season_id = Season.last.id
      entries = PaymentScheduleEntry.for_season(season_id).order(:pay_date)
      dates = (entries.first.pay_date..entries.last.pay_date).select { |d| d.wday.zero? }
      dates.map { |d| [d, Payment.for_season(season_id).where('date_paid <= ?', d).sum(:amount).to_f / 100.0] }
    end
  end
end
# rubocop:enable AbcSize
