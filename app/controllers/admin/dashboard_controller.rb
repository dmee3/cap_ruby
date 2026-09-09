# frozen_string_literal: true

module Admin
  class DashboardController < AdminController
    def index
      season_id = current_season['id']

      @stats = {
        expected_cents: PaymentService.total_dues_owed_to_date(season_id),
        collected_cents: PaymentService.total_dues_paid_to_date(season_id),
        average_days_late: DashboardUtilities.average_days_late(season_id)
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
          section: member.section_for(season_id),
          schedule_edit_path: schedule && edit_admin_payment_schedule_path(schedule)
        }
      end
    end

    # Pending conflicts still ahead of us, oldest start first — the "needs a
    # decision" queue, using the shared ConflictPresenter row shape.
    def conflicts_to_review(season_id)
      conflicts = Conflict
                  .includes(:conflict_status, :user)
                  .for_season(season_id)
                  .future_conflicts
                  .order(:start_date)
                  .select { |c| c.status.name == 'Pending' }

      ConflictPresenter.rows_for(conflicts).map.with_index do |row, i|
        row.merge(member: conflicts[i].user.full_name)
      end
    end
  end
end
