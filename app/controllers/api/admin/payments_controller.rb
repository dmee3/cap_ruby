# frozen_string_literal: true

module Api
  module Admin
    class PaymentsController < Api::AdminController
      # jbuilder
      def index
        @users = PaymentService.season_payment_details(current_season['id'])
      end

      def upcoming
        @payments = PaymentService.upcoming_payments(start_param, end_param, current_season['id'])
        render json: @payments
      end

      def latest_venmo
        @payment = Payment
          .for_season(current_season['id'])
          .where(payment_type_id: PaymentType.venmo.id)
          .order(created_at: :desc)
          .first
        render json: @payment, include: [:user]
      end

      private

      def start_param
        return DateTime.parse(params[:start]) if params[:start]
        
        Date.today
      end

      def end_param
        return DateTime.parse(params[:end]) if params[:end]

        10.weeks.from_now
      end
    end
  end
end
