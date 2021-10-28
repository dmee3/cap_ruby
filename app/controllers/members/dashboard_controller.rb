# frozen_string_literal: true

module Members
  class DashboardController < MembersController
    def index
      @conflicts = current_user.conflicts.includes(:conflict_status).for_season(current_season['id']).order(:start_date)

      @payments = current_user.payments_for(current_season['id']).sort_by(&:date_paid)
      @payment_schedule = current_user.payment_schedule_for(current_season['id'])
      @next_payment_date = @payment_schedule.entries.select { |e| e.pay_date >= Date.today }.first || @payment_schedule.entries.last
      @next_payment_amount = PaymentService.amount_owed_on_date(current_user, @next_payment_date.pay_date, current_season['id'])
      @paid = @payments.sum(&:amount) / 100
      @total_dues = @payment_schedule.entries.sum(:amount) / 100

      @next_event = EventService.next_event
      flash[:success] = 'Test Long Flash Message'
    end
  end
end
