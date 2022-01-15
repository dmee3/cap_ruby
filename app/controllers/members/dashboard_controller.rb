# frozen_string_literal: true

module Members
  class DashboardController < MembersController
    def index
      @conflicts = current_user
                   .conflicts
                   .includes(:conflict_status)
                   .for_season(current_season['id'])
                   .order(:start_date)

      @payments = current_user.payments_for(current_season['id']).sort_by(&:date_paid)
      @payment_schedule = current_user.payment_schedule_for(current_season['id'])
      @entries = @payment_schedule.entries.order(:pay_date)
      @next_payment_date = @entries.select { |e| e.pay_date >= Date.today }.first || @entries.last
      @next_payment_amount = PaymentService.amount_owed_on_date(
        current_user,
        @next_payment_date.pay_date, current_season['id']
      )
      @paid = @payments.sum(&:amount) / 100
      @total_dues = @entries.sum(:amount) / 100

      @next_event = EventService.next_event(current_season['id'])
    end
  end
end
