# frozen_string_literal: true

module Api
  module Admin
    class PaymentsController < Api::AdminController
      # jbuilder
      def index
        @users = PaymentService.season_payment_details(current_season['id'])
      end

      def create
        payment_data = payment_params.to_h
        # Convert amount to cents before assigning to avoid integer truncation
        # Use round to handle floating point precision issues
        payment_data[:amount] = (payment_data[:amount].to_f * 100).round if payment_data[:amount]

        @payment = Payment.new(payment_data)
        @payment.season_id = current_season['id']

        if @payment.save
          render json: { success: true, payment: @payment }, status: :created
        else
          render json: { success: false, errors: @payment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def collected
        @payments = PaymentService.payments_collected_to_date(current_season['id'])
        render json: @payments
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

      def payment_params
        params.require(:payment).permit(:user_id, :payment_type_id, :amount, :date_paid, :notes)
      end

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
