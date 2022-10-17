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

      def create_default
        @schedule = PaymentSchedule.find params[:payment_schedule_id]
        default_schedule = PaymentScheduleService.default_schedule_for(@schedule.user, current_season)
        @schedule.entries.destroy_all
        default_schedule.each do |day, amount|
          @schedule.entries.create(pay_date: Date.strptime(day, '%m/%d/%y'), amount: amount * 100)
        end
        flash[:success] = 'Default payment schedule created!'
        head 200
      rescue StandardError => e
        render json: { errors: e.message }, status: 500
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
