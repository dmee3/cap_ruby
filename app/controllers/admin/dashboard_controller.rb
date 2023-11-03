# frozen_string_literal: true

module Admin
  class DashboardController < AdminController
    def index
      @expected_dues = PaymentService.total_dues_owed_to_date(current_season['id'])
      @actual_dues = PaymentService.total_dues_paid_to_date(current_season['id'])
      @next_event = EventService.next_event(current_season['id'])
      check_empty_payment_schedules
    end

    private

    def expected_dues
      PaymentScheduleEntry.for_season(current_season['id']).past_entries.sum(&:amount)
    end

    def actual_dues
      Payment.for_season(current_season['id']).sum(&:amount)
    end

    def check_empty_payment_schedules
      members = User.members_for_season(current_season['id']).with_payments
      members.each do |m|
        next unless m.payment_schedule_for(current_season['id']).entries.blank?

        flash.now[:error] ||= []
        flash.now[:error] << "Member found with blank payment schedule: #{m.full_name}"
      end
    end
  end
end
