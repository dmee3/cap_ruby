# rubocop:disable AbcSize
class DashboardUtilities
  class << self
    def payment_sums_by_week
      # Payment.all
      #        .order(:date_paid)
      #        .group_by { |payment, _| payment.date_paid.end_of_week }
      #        .map { |week, payments| [week, payments.sum(&:amount).round(2) / 100] }
    end

    def payment_schedule_sums_by_week
      # PaymentScheduleEntry.where('pay_date <= ?', Date.today)
      #                     .order(:pay_date)
      #                     .group_by { |entry, _| entry.pay_date.end_of_week }
      #                     .map { |week, entries| [week, entries.sum(&:amount).round(2) / 100] }
    end

    def upcoming_payments(start_date, end_date, season_id)
      entries = PaymentScheduleEntry.includes(payment_schedule: :user)
                                    .where('pay_date in (?)', (start_date..end_date))
                                    .order(:pay_date)

      [].tap do |array|
        entries.each do |e|
          next if array.any? { |a| a[:user_id] == e.user.id }
          balance = e.total_to_date - e.user.amount_paid_for(season_id)
          next if balance <= 0
          array << {
            pay_date: e.pay_date.strftime('%-m/%-d/%y'),
            amount: balance.to_f / 100.0,
            user_id: e.user.id,
            name: e.user.full_name
          }
        end
      end
    end

    def behind_members(season_id)
      # members = User.includes(:payments, payment_schedule: :payment_schedule_entries)
      #               .where(role: Role.find_by_name('member'))
      #               .order(:first_name)
      # members.reject(&:dues_status_okay?(season_id)).map do |m|
      #   {
      #     name: m.full_name,
      #     paid: m.amount_paid_for(season_id).to_f / 100.0,
      #     owed: m.payment_schedule
      #            .payment_schedule_entries
      #            .where('pay_date <= ?', Date.today)
      #            .sum(:amount)
      #            .to_f / 100.0
      #   }
      # end
    end

    def biweekly_scheduled
      # dates = (Season.season_start..Season.season_end).select { |d| d.wday.zero? }
      # dates.map { |d| [d, PaymentScheduleEntry.where('pay_date <= ?', d).sum(:amount).to_f / 100.0] }
    end

    def biweekly_actual
      # dates = (Season.season_start..Season.season_end).select { |d| d.wday.zero? }
      # dates.map { |d| [d, Payment.where('date_paid <= ?', d).sum(:amount).to_f / 100.0] }
    end
  end
end
# rubocop:enable AbcSize
