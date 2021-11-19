# frozen_string_literal: true

module Admin
  class PaymentSchedulesController < AdminController
    def edit
      @schedule = PaymentSchedule.find(params[:id])
      @user = User.find(@schedule.user_id)
    end
  end
end
