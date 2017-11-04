class DefaultPaymentSchedule
  ENTRIES = [
    { amount: 30000, pay_date: Date.parse('2017-10-15') },
    { amount: 23000, pay_date: Date.parse('2017-11-19') },
    { amount: 23000, pay_date: Date.parse('2017-12-17') },
    { amount: 23000, pay_date: Date.parse('2018-01-14') },
    { amount: 23000, pay_date: Date.parse('2018-02-11') },
    { amount: 23000, pay_date: Date.parse('2018-03-11') }
  ].freeze

  def self.create(user_id)
    schedule = PaymentSchedule.create user_id: user_id
    ENTRIES.each do |entry|
      PaymentScheduleEntry.create amount: entry[:amount],
                                  pay_date: entry[:pay_date],
                                  payment_schedule_id: schedule.id
    end
  end
end
