# frozen_string_literal: true

module Admin
  class PaymentSchedulesController < AdminController
    def edit
      @schedule = PaymentSchedule.find(params[:id])
      @user = User.find(@schedule.user_id)
      @default_schedule = PaymentScheduleService.default_schedule_for(@user, current_season)
      set_ensemble_membership
    end

    private

    def set_ensemble_membership
      @vet = @user.vet_in?(current_season['id'])
      @ensemble = @user.ensemble_for(current_season['id'])
      @section = @user.section_for(current_season['id'])
    end
  end
end
