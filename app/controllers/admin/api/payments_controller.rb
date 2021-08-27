module Admin
  module Api
    class PaymentsController < ApiController
      def index
        @payments = upcoming_payments(start_param, end_param)
        render json: @payments
      end

      private

      def upcoming_payments(start_date, end_date)
        entries = PaymentScheduleEntry
          .for_season(5)
          .includes(payment_schedule: { user: :payments })
          .where(pay_date: Date.today..10.weeks.from_now)

        entries.map do |e|
          {
            scheduled: e.schedule.scheduled_to_date(e.pay_date),
            paid: e.schedule.user.amount_paid_for(current_season['id']),
            current_amount: e.amount,
            date: e.pay_date,
            name: e.schedule.user.full_name,
            user_id: e.schedule.user.id
          }
        end.select { |e| e[:scheduled] - e[:paid] > 0 }.sort { |e| e[:date] }
      end

      def start_param
        DateTime.parse(params[:start]) if params[:start]
        DateTime.parse('2000-01-01')
      end

      def end_param
        DateTime.parse(params[:end]) if params[:end]
        DateTime.parse('2030-01-01')
      end
    end
  end
end
