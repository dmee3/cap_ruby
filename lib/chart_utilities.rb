class ChartUtilities
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
end