# frozen_string_literal: true

module Api
  module Admin
    class PaymentSchedulesController < Api::AdminController
      def show
        @schedule = PaymentSchedule.includes(:payment_schedule_entries).find(params[:id])
        render json: @schedule, include: [:payment_schedule_entries]
      end

      def update
        @schedule = PaymentSchedule.find update_params[:id]
        if @schedule.update update_params
          flash[:success] = 'Payment schedule updated'
          head :no_content
        else
          render json: { errors: @schedule.errors.messages }, status: 422
        end
      end

      def remove_entry
        @entry = PaymentScheduleEntry.find params[:id]
        if @entry.destroy
          head :no_content
        else
          render json: { errors: @entry.errors.messages }, status: 422
        end
      end
  
      def add_entry
        entry_vars = add_entry_params.merge(pay_date: Date.today, amount: 0)
        @entry = PaymentScheduleEntry.new entry_vars
        if @entry.save
          render json: @entry
        else
          render json: { errors: @entry.errors.messages }, status: 422
        end
      end

      private
  
      def update_params
        params.require(:payment_schedule).permit(
          :id,
          payment_schedule_entries_attributes: %i[id pay_date amount]
        )
      end
  
      def add_entry_params
        params.permit(:payment_schedule_id)
      end
    end
  end
end