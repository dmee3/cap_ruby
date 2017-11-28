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

  def self.upcoming_payments(start_date, end_date)
    entries = PaymentScheduleEntry.where('pay_date >= ?', start_date)
                                  .where('pay_date < ?', end_date)
                                  .includes(payment_schedule: :user)
                                  .order(:pay_date)
    entries.map do |e|
      {
        pay_date: e.pay_date.strftime('%-m/%-d/%y'),
        amount: e.amount.to_f / 100.0,
        user_id: e.payment_schedule.user.id,
        name: e.payment_schedule.user.full_name
      }
    end
  end

  def self.behind_members
    members = User.includes(:payments, payment_schedule: :payment_schedule_entries)
                  .where(role: Role.find_by_name('member'))
                  .order(:first_name)
    members.reject(&:dues_status_okay?).map do |m|
      {
        name: m.full_name,
        paid: m.amount_paid.to_f / 100.0,
        owed: m.payment_schedule
               .payment_schedule_entries
               .where('pay_date <= ?', Date.today)
               .sum(:amount)
               .to_f / 100.0
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
