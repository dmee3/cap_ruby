class DefaultPaymentSchedule
  class << self
    def create(user_id, season_id)
      PaymentSchedule.create(user_id: user_id, season_id: season_id).tap do |schedule|
        entries.each do |entry|
          PaymentScheduleEntry.create(
            amount: entry[:amount],
            pay_date: entry[:pay_date],
            payment_schedule_id: schedule.id
          )
        end
      end
    end

    private

    def entries
      [
        { amount: 30000, pay_date: Date.parse('2019-10-20') },
        { amount: 30000, pay_date: Date.parse('2019-11-17') },
        { amount: 30000, pay_date: Date.parse('2019-12-15') },
        { amount: 30000, pay_date: Date.parse('2020-01-12') },
        { amount: 30000, pay_date: Date.parse('2020-02-09') }
      ]
    end
  end
end
