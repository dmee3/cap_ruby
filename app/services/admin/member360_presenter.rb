# frozen_string_literal: true

module Admin
  # The plain view-model behind `/admin/users/:id` (Member 360). The controller
  # builds it; the React widget renders it — no client-side data shaping, same
  # pattern as Flow 2's member dashboard.
  #
  # All money is integer cents. The calendar fundraiser is DELIBERATELY its own
  # figure and is never folded into dues (the two systems are decoupled —
  # design review #16).
  class Member360Presenter
    class << self
      def call(user, season)
        season_id = season['id']
        schedule = user.payment_schedule_for(season_id)

        rows = payment_rows(user, season_id)
        live = rows.reject { |r| r[:deleted] }

        {
          season_label: season['year'],
          identity: identity(user, season_id),
          dues: PaymentService.member_dues_summary(user, season_id),
          roles_by_season: roles_by_season(user, season_id),
          schedule: schedule_view(schedule, user, season_id),
          schedule_setup_href: schedule && "/admin/payment_schedules/#{schedule.id}/edit",
          payment_rows: rows,
          payments_summary: {
            count: live.length,
            total_cents: live.sum { |r| r[:amount_cents] }
          },
          conflict_rows: conflict_rows(user, season_id),
          conflicts_count: user.conflicts.for_season(season_id).size,
          fundraiser: fundraiser(user, season_id)
        }
      end

      private

      def identity(user, season_id)
        member_seasons = user.seasons_users.count { |su| su.role == 'member' }
        vet = user.vet_in?(season_id)

        {
          id: user.id,
          name: user.full_name,
          first_name: user.first_name,
          username: user.username,
          email: user.email,
          phone: user.try(:phone),
          ensemble: user.ensemble_for(season_id),
          section: user.section_for(season_id),
          role: user.role_for(season_id)&.titleize,
          vet: vet,
          # "Vet · 3rd season" reads better on the pill than a bare flag.
          member_type: vet ? "Vet · #{ordinal(member_seasons)} season" : 'New member'
        }
      end

      def ordinal(number)
        return "#{number}th" if (11..13).cover?(number % 100)

        suffix = { 1 => 'st', 2 => 'nd', 3 => 'rd' }.fetch(number % 10, 'th')
        "#{number}#{suffix}"
      end

      # The canvas joins the reason and the relative time into one caption
      # line rather than stacking them.
      def conflict_rows(user, season_id)
        conflicts = user.conflicts.for_season(season_id).includes(:conflict_status).sort_by(&:start_date)
        ConflictPresenter.rows_for(conflicts).map do |row|
          subline = [row[:reason], row[:relative_subline]].compact.reject(&:empty?).join(' · ')
          row.merge(relative_subline: subline).except(:reason)
        end
      end

      # One row per season the user was a MEMBER (a member who later became
      # staff shouldn't list their staff seasons), newest first. The role
      # rides along so the current row can read "… · Section leader".
      def roles_by_season(user, current_season_id)
        user.seasons_users
            .select { |su| su.role == 'member' }
            .sort_by { |su| -su.season.year.to_i }
            .map do |su|
              {
                year: su.season.year,
                ensemble: su.ensemble,
                section: su.section,
                role: su.role&.titleize,
                current: su.season_id == current_season_id
              }
            end
      end

      # Entry rows carry a derived status — none of it is stored. `covered`
      # stays for callers that only need the boolean.
      def schedule_view(schedule, user, season_id)
        return { id: nil, total_cents: 0, entries: [] } if schedule.nil?

        paid = user.amount_paid_for(season_id)
        payments = user.payments_for(season_id).sort_by(&:date_paid)
        running = 0
        next_due_taken = false
        today = Date.current

        entries = schedule.entries.sort_by(&:pay_date).map do |entry|
          running += entry.amount
          covered = paid >= running
          status, label = entry_status(entry, covered, next_due_taken, today)
          next_due_taken = true if status == 'due-next'

          {
            id: entry.id,
            pay_date: entry.pay_date.iso8601,
            amount_cents: entry.amount,
            covered: covered,
            status: status,
            status_label: covered ? "Paid #{covered_on(payments, running)}" : label
          }
        end

        { id: schedule.id, total_cents: schedule.entries.sum(&:amount), entries: entries }
      end

      def entry_status(entry, covered, next_due_taken, today)
        return %w[paid Paid] if covered
        return ['late', "#{(today - entry.pay_date).to_i} days late"] if entry.pay_date < today
        return ['due-next', "Due in #{(entry.pay_date - today).to_i} days"] unless next_due_taken

        %w[not-due Upcoming]
      end

      # The date the running payment total first reached this entry's
      # cumulative amount — what "Paid 11/10" refers to.
      def covered_on(payments, target_cents)
        running = 0
        payments.each do |payment|
          running += payment.amount
          return payment.date_paid.strftime('%-m/%-d') if running >= target_cents
        end
        nil
      end

      def payment_rows(user, season_id)
        Payment.with_deleted
               .where(user_id: user.id, season_id: season_id)
               .includes(:payment_type)
               .order(date_paid: :desc)
               .map do |payment|
                 {
                   id: payment.id,
                   amount_cents: payment.amount,
                   date_paid: payment.date_paid&.iso8601,
                   payment_type: payment.payment_type.name,
                   notes: payment.notes,
                   deleted: payment.deleted_at.present?,
                   edit_href: "/admin/payments/#{payment.id}/edit",
                   restore_href: "/admin/payments/restore/#{payment.id}"
                 }
               end
      end

      def fundraiser(user, season_id)
        fundraisers = user.calendar_fundraisers_for(season_id).includes(:donations)
        {
          raised_cents: fundraisers.flat_map(&:donations).sum(&:amount),
          dates_covered: fundraisers.sum(&:total_donations),
          dates_target: Calendar::Fundraiser::TOTAL_MARCH_DATES
        }
      end
    end
  end
end
