# frozen_string_literal: true

module Admin
  # View-model for /admin/payment_schedules/:id/edit. Derives each entry's
  # status (covered / due-next / not-due / late) from the running payment
  # total vs. the cumulative scheduled amount — none of it is stored.
  class ScheduleEditorPresenter
    class << self
      def call(schedule, season)
        season_id = season['id']
        user = schedule.user
        paid = user.amount_paid_for(season_id)
        entries = schedule.entries.sort_by(&:pay_date)
        today = Date.current

        {
          schedule_id: schedule.id,
          member: {
            id: user.id,
            name: user.full_name,
            ensemble: user.ensemble_for(season_id),
            section: user.section_for(season_id),
            vet: user.vet_in?(season_id)
          },
          paid_cents: paid,
          planned_cents: entries.sum(&:amount),
          entries: entry_views(entries, paid, today)
        }
      end

      private

      def entry_views(entries, paid, today)
        running = 0
        next_unpaid_seen = false
        entries.map do |entry|
          running += entry.amount
          covered = paid >= running
          status =
            if covered
              'paid'
            elsif entry.pay_date < today
              'late'
            elsif !next_unpaid_seen
              next_unpaid_seen = true
              'due-next'
            else
              'not-due'
            end
          {
            id: entry.id,
            pay_date: entry.pay_date.iso8601,
            amount_cents: entry.amount,
            status: status,
            days_late: status == 'late' ? (today - entry.pay_date).to_i : nil
          }
        end
      end
    end
  end
end
