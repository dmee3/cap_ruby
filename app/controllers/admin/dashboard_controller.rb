# frozen_string_literal: true

module Admin
  class DashboardController < AdminController
    def index
      @expected_dues = expected_dues
      @actual_dues = actual_dues
      @behind_members = behind_members(current_season['id'])
      @next_event = EventService.next_event
    end

    private

    def expected_dues
      PaymentScheduleEntry.for_season(current_season['id']).past_entries.sum(&:amount)
    end

    def actual_dues
      Payment.for_season(current_season['id']).sum(&:amount)
    end

    def behind_members(season_id)
      members = User.members_for_season(season_id).with_payments.to_a
      members.reject! { |m| m.dues_status_okay?(season_id) }
      members.map do |m|
        {
          id: m.id,
          name: m.full_name,
          behind: (m.payment_schedule_for(season_id).scheduled_to_date - m.amount_paid_for(season_id)),
          last_payment: m.payments.for_season(season_id).last
        }
      end
    end
  end
end
