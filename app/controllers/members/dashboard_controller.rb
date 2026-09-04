# frozen_string_literal: true

module Members
  class DashboardController < MembersController
    def index
      season_id = current_season['id']

      @conflicts = current_user
                   .conflicts
                   .includes(:conflict_status)
                   .for_season(season_id)
                   .order(:start_date)

      @payments = current_user.payments_for(season_id).sort_by(&:date_paid)
      @dues = PaymentService.member_dues_summary(current_user, season_id)

      @next_event = EventService.next_event(season_id)

      assign_legacy_dues_ivars(season_id)
    end

    private

    # The pre-Flow-2 dashboard view still reads these. Removed in phase 3 when
    # the view is rebuilt around @dues.
    def assign_legacy_dues_ivars(season_id)
      schedule = current_user.payment_schedule_for(season_id)
      @payment_schedule = schedule
      @entries = schedule&.entries&.order(:pay_date) || []
      @next_payment_date = @entries.find { |e| e.pay_date >= Date.current } || @entries.last
      @next_payment_amount =
        if @next_payment_date
          PaymentService.amount_owed_on_date(current_user, @next_payment_date.pay_date, season_id)
        else
          0
        end
      @paid = @payments.sum(&:amount) / 100
      @total_dues = @entries.sum(&:amount) / 100
    end
  end
end
