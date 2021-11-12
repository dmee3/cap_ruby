# frozen_string_literal: true

module Api
  module Admin
    class PaymentSchedulesController < Api::AdminController
      def show
        @schedule = PaymentSchedule.includes(:payment_schedule_entries).find(params[:id])
        render json: @schedule, include: [:payment_schedule_entries]
      end
    end
  end
end
