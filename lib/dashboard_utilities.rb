class DashboardUtilities
  def self.payment_sums_by_week
    Payment.all
           .order(:date_paid)
           .group_by { |payment, _| payment.date_paid.end_of_week }
           .map { |week, payments| [week, payments.sum(&:amount).round(2) / 100] }
  end

  def self.payment_schedule_sums_by_week
    PaymentScheduleEntry.all
                        .order(:pay_date)
                        .group_by { |entry, _| entry.pay_date.end_of_week }
                        .map { |week, entries| [week, entries.sum(&:amount).round(2) / 100] }
  end

  def self.upcoming_payments
    entries = PaymentScheduleEntry.where('pay_date >= ?', Date.today)
                                  .where('pay_date < ?', Date.today + 1.month)
                                  .includes(payment_schedule: :user)
                                  .order(:pay_date)
    entries.map do |e|
      {
        pay_date: e.pay_date,
        amount: e.amount.to_f / 100.0,
        user_id: e.payment_schedule.user.id,
        name: e.payment_schedule.user.full_name
      }
    end
  end

  def self.biweekly_scheduled
    dates = (Season.season_start..Season.season_end).select { |d| d.wday.zero? }
    dates.map { |d| [d, PaymentScheduleEntry.where('pay_date <= ?', d).sum(:amount).to_f / 100.0] }
  end

  def self.biweekly_actual
    dates = (Season.season_start..Season.season_end).select { |d| d.wday.zero? }
    dates.map { |d| [d, Payment.where('date_paid <= ?', d).sum(:amount).to_f / 100.0] }
  end
end
