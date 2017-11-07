class DashboardUtilities
  def self.payment_sums_by_week
    Payment.all
            .order(:date_paid)
            .group_by { |payment, _| payment.date_paid.end_of_week }
            .map { |week, payments| [week, payments.sum { |p| p.amount }.round(2) / 100] }
  end

  def self.payment_schedule_sums_by_week
    PaymentScheduleEntry.all
                        .order(:pay_date)
                        .group_by { |entry, _| entry.pay_date.end_of_week }
                        .map { |week, entries| [week, entries.sum { |p| p.amount }.round(2) / 100] }
  end

  def self.upcoming_payments(limit = 10)
    members = User.where(role: Role.find_by_name('member'))
                  .includes(:payments, payment_schedule: :payment_schedule_entries)
                  .select { |u| u.amount_paid < u.payment_schedule.entries.where('pay_date <= ?', Date.today) }
  end
end
