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
        { amount: 30000, pay_date: Date.parse('2018-10-21') },
        { amount: 23000, pay_date: Date.parse('2018-11-18') },
        { amount: 23000, pay_date: Date.parse('2018-12-16') },
        { amount: 23000, pay_date: Date.parse('2019-01-13') },
        { amount: 23000, pay_date: Date.parse('2019-02-10') },
        { amount: 23000, pay_date: Date.parse('2019-03-10') }
      ]
    end
  end
end
