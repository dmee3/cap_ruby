# frozen_string_literal: true

module Admin
  # View-model for /admin/payment_schedules/:id/edit. Derives each entry's
  # status (paid / due-next / not-due / late) from the running payment total
  # vs. the cumulative scheduled amount — none of it is stored.
  class ScheduleEditorPresenter
    class << self
      def call(schedule, season)
        season_id = season['id']
        user = schedule.user
        paid = user.amount_paid_for(season_id)
        entries = schedule.entries.sort_by(&:pay_date)
        payments = user.payments_for(season_id).sort_by(&:date_paid)
        today = Date.current
        default = PaymentScheduleService.default_schedule_for(user, season)

        {
          schedule_id: schedule.id,
          season_label: season['year'],
          member: member_view(user, season_id),
          paid_cents: paid,
          planned_cents: entries.sum(&:amount),
          locked_count: entries.count { |e| covered?(e, entries, paid) },
          matches_default: matches_default?(entries, default),
          entries: entry_views(entries, paid, payments, today)
        }
      end

      private

      def member_view(user, season_id)
        vet = user.vet_in?(season_id)
        {
          id: user.id,
          name: user.full_name,
          ensemble: user.ensemble_for(season_id),
          section: user.section_for(season_id),
          vet: vet,
          member_type: vet ? 'Vet' : 'New member'
        }
      end

      # True when the schedule is byte-for-byte the per-year default — the
      # editor says "Default new-member schedule, unedited" rather than
      # offering a diff nobody needs.
      def matches_default?(entries, default)
        return false if default.nil?

        mine = entries.map { |e| [e.pay_date, e.amount] }.sort
        theirs = default.map { |day, dollars| [Date.strptime(day, '%m/%d/%y'), dollars * 100] }.sort
        mine == theirs
      end

      def covered?(entry, entries, paid)
        running = 0
        entries.each do |e|
          running += e.amount
          return paid >= running if e == entry
        end
        false
      end

      def entry_views(entries, paid, payments, today)
        running = 0
        next_due_taken = false

        entries.map do |entry|
          running += entry.amount
          covered = paid >= running
          status = status_for(entry, covered, next_due_taken, today)
          next_due_taken = true if status == 'due-next'

          {
            id: entry.id,
            pay_date: entry.pay_date.iso8601,
            amount_cents: entry.amount,
            status: status,
            days_late: status == 'late' ? (today - entry.pay_date).to_i : nil,
            covered_on: covered ? covered_on(payments, running) : nil
          }
        end
      end

      def status_for(entry, covered, next_due_taken, today)
        return 'paid' if covered
        return 'late' if entry.pay_date < today
        return 'due-next' unless next_due_taken

        'not-due'
      end

      def covered_on(payments, target_cents)
        running = 0
        payments.each do |payment|
          running += payment.amount
          return payment.date_paid.strftime('%-m/%-d') if running >= target_cents
        end
        nil
      end
    end
  end
end
