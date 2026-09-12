# frozen_string_literal: true

module Admin
  class DashboardController < AdminController
    def index
      season_id = current_season['id']

      @stats = {
        expected_cents: PaymentService.total_dues_owed_to_date(season_id),
        collected_cents: PaymentService.total_dues_paid_to_date(season_id),
        average_days_late: DashboardUtilities.average_days_late(season_id),
        member_count: User.members_for_season(season_id).count
      }
      @behind_members = DashboardUtilities.behind_members(season_id)
      @stats[:behind_count] = @behind_members.length

      @burndown = {
        scheduled: DashboardUtilities.season_scheduled_series(season_id),
        actual: DashboardUtilities.season_actual_series(season_id),
        today: Date.current.iso8601,
        currency: 'USD'
      }
      @recent_payments = recent_payment_rows(season_id)
      @blank_schedule_members = blank_schedule_members(season_id)
      @conflicts_to_review = conflicts_to_review(season_id)
    end

    private

    # Non-deleted payments in the last 30 days, newest first, cents shape.
    def recent_payment_rows(season_id)
      Payment
        .for_season(season_id)
        .includes(:user, :payment_type)
        .where(date_paid: 30.days.ago.to_date..Date.current)
        .order(date_paid: :desc, id: :desc)
        .map do |payment|
          {
            id: payment.id,
            name: payment.user.full_name,
            user_id: payment.user_id,
            amount_cents: payment.amount,
            date_paid: payment.date_paid.iso8601,
            payment_type: payment.payment_type.name
          }
        end
    end

    # Members whose payment schedule has no entries — missing from the burndown.
    def blank_schedule_members(season_id)
      User.members_for_season(season_id).with_payments.filter_map do |member|
        schedule = member.payment_schedule_for(season_id)
        next if schedule&.entries&.any?

        {
          name: member.full_name,
          # "New member · Battery / Snare" — type leads, per the canvas.
          meta: [
            member.vet_in?(season_id) ? 'Vet' : 'New member',
            [member.ensemble_for(season_id), member.section_for(season_id)].compact.join(' / ').presence
          ].compact.join(' · '),
          schedule_edit_path: schedule && edit_admin_payment_schedule_path(schedule)
        }
      end
    end

    # Pending conflicts still ahead of us — the "needs a decision" queue, in the
    # same shape the triage screens use. Previously paired rows to conflicts by
    # array index, which only held while both stayed in the same order.
    def conflicts_to_review(season_id)
      conflicts = Conflict
                  .includes(:conflict_status, user: :seasons_users)
                  .for_season(season_id)
                  .future_conflicts
                  .order(:start_date)
                  .select { |c| c.status.name == 'Pending' }

      ConflictTriagePresenter.groups_for(conflicts, season_id, current_user).flat_map do |group|
        group[:rows].map { |row| row.merge(member: group[:member]) }
      end
    end
  end
end
