# rubocop:disable AbcSize
class DashboardUtilities
  class << self
    def payment_sums_by_week
      all_payments = Payment.for_season(Season.last.id).order(:date_paid)
      weekly_payments = all_payments.group_by { |payment, _| payment.date_paid.end_of_week }
      weekly_payments.map { |week, payments| [week, payments.sum(&:amount).round(2) / 100] }
    end

    def payment_schedule_sums_by_week
      # Get all payment schedule entries for the season and set date to a Sunday
      entries = PaymentScheduleEntry.for_season(Season.last.id).where('pay_date <= ?', Date.today)
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
      entries = PaymentScheduleEntry.for_season(season_id)
                                    .where(pay_date: start_date..end_date)
                                    .order(:pay_date)

      [].tap do |array|
        entries.each do |e|
          next if array.any? { |a| a[:user_id] == e.user.id } # Skip if we already recorded them
          balance = e.payment_schedule.scheduled_to_date(e.pay_date) - e.user.amount_paid_for(season_id)
          next if balance <= 0 # Skip if they've paid ahead
          array << {
            pay_date: e.pay_date.strftime('%-m/%-d/%y'),
            amount: balance.to_f / 100,
            user_id: e.user.id,
            name: e.user.full_name
          }
        end
      end
    end
    # rubocop:enable Metrics/MethodLength

    def behind_members(season_id)
      members = User.for_season(season_id).with_role(:member).to_a
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
