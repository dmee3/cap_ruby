# frozen_string_literal: true

module Admin
  class PaymentSchedulesController < AdminController
    def edit
      @schedule = PaymentSchedule.includes(:payment_schedule_entries, user: :payments).find(params[:id])
      @editor = Admin::ScheduleEditorPresenter.call(@schedule, current_season)
    end
  end
end
