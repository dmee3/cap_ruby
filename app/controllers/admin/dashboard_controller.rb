module Admin
  class DashboardController < AdminController
    def index
      @expected_dues = expected_dues
      @actual_dues = actual_dues
      @upcoming_conflicts = upcoming_conflicts
      @upcoming_payments = upcoming_payments(Date.today, 10.weeks.from_now, current_season['id'])
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
      members = User.for_season(season_id).with_payments.with_role(:member).to_a
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

    def upcoming_conflicts
      Conflict.includes(:user).for_season(current_season['id']).future_conflicts.sort_by(&:start_date)
    end

    def upcoming_payments(start_date, end_date, season_id)
      entries = PaymentScheduleEntry
        .for_season(5)
        .includes(payment_schedule: { user: :payments })
        .where(pay_date: Date.today..10.weeks.from_now)

      entries.map do |e|
        {
          amount: e.schedule.scheduled_to_date(e.pay_date) - e.schedule.user.amount_paid_for(season_id),
          date: e.pay_date,
          name: e.schedule.user.full_name
        }
      end.select { |e| e[:amount] > 0 }.sort { |e| e[:date] }
    end
  end
end
