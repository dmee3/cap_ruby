class PaymentService
  class << self
    def season_payment_details(season_id)
      users = User
          .includes(:payments, payment_schedules: :payment_schedule_entries)
          .members_for_season(season_id)
    end

    def upcoming_payments(start_date, end_date, season_id)
      entries = PaymentScheduleEntry
                .for_season(5)
                .includes(payment_schedule: { user: :payments })
                .where(pay_date: start_date..end_date)

      entries.map do |e|
        {
          scheduled: e.schedule.scheduled_to_date(e.pay_date),
          paid: e.schedule.user.amount_paid_for(season_id),
          current_amount: e.amount,
          date: e.pay_date,
          name: e.schedule.user.full_name,
          user_id: e.schedule.user.id
        }
      end.select { |e| (e[:scheduled] - e[:paid]).positive? }.sort { |e| e[:date] }
    end

    def amount_owed_on_date(user, date, season_id)
      schedule = user.payment_schedule_for(season_id)
      return 0 unless schedule.present?

      owed = schedule.entries.select { |e| e.pay_date <= date }.sum(&:amount)
      paid = user.payments_for(season_id).sum(&:amount)
      (owed - paid) / 100.0
    end
  end
end
