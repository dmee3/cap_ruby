# frozen_string_literal: true

module Admin
  class DashboardController < AdminController
    def index
      @members = User.members_for_season(current_season['id']).with_payments
      @expected_dues = PaymentService.dues_owed_in_current_period(current_season['id'])
      @actual_dues = PaymentService.dues_paid_in_current_period(current_season['id'])
      @behind_members = behind_members
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

    def behind_members
      s_id = current_season['id']
      @members.to_a.reject { |m| m.dues_status_okay?(s_id) }.map do |m|
        {
          id: m.id,
          name: m.full_name,
          behind: (m.payment_schedule_for(s_id).scheduled_to_date - m.amount_paid_for(s_id)),
          last_payment: m.payments_for(s_id).max_by(&:date_paid)
        }
      end
    end

    def check_empty_payment_schedules
      @members.each do |m|
        next unless m.payment_schedule_for(current_season['id']).entries.blank?

        flash.now[:error] ||= []
        flash.now[:error] << "Member found with blank payment schedule: #{m.full_name}"
      end
    end
  end
end
