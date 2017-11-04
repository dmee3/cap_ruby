class DefaultPaymentSchedule

  def self.create(user_id)
    schedule = PaymentSchedule.create user_id: user_id
    Season::default_payment_schedule.each do |entry|
      PaymentScheduleEntry.create amount: entry[:amount],
                                  pay_date: entry[:pay_date],
                                  payment_schedule_id: schedule.id
    end
  end
end
