class PaymentSchedulesController < ApplicationController
  def index
    @schedules = PaymentSchedule.all
  end
end
