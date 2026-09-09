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

        {
          season_label: season['year'],
          identity: identity(user, season_id),
          dues: PaymentService.member_dues_summary(user, season_id),
          roles_by_season: roles_by_season(user, season_id),
          schedule: schedule_view(schedule, user, season_id),
          payment_rows: payment_rows(user, season_id),
          conflict_rows: ConflictPresenter.rows_for(
            user.conflicts.for_season(season_id).includes(:conflict_status).sort_by(&:start_date)
          ),
          conflicts_count: user.conflicts.for_season(season_id).size,
          fundraiser: fundraiser(user, season_id)
        }
      end

      private

      def identity(user, season_id)
        {
          id: user.id,
          name: user.full_name,
          username: user.username,
          email: user.email,
          phone: user.try(:phone),
          ensemble: user.ensemble_for(season_id),
          section: user.section_for(season_id),
          role: user.role_for(season_id),
          vet: user.vet_in?(season_id)
        }
      end

      # One row per season the user was a MEMBER (a member who later became
      # staff shouldn't list their staff seasons), newest first.
      def roles_by_season(user, current_season_id)
        user.seasons_users
            .select { |su| su.role == 'member' }
            .sort_by { |su| -su.season.year.to_i }
            .map do |su|
              {
                year: su.season.year,
                ensemble: su.ensemble,
                section: su.section,
                current: su.season_id == current_season_id
              }
            end
      end

      def schedule_view(schedule, user, season_id)
        return { id: nil, total_cents: 0, entries: [] } if schedule.nil?

        paid = user.amount_paid_for(season_id)
        running = 0
        {
          id: schedule.id,
          total_cents: schedule.entries.sum(&:amount),
          entries: schedule.entries.sort_by(&:pay_date).map do |entry|
            running += entry.amount
            {
              id: entry.id,
              pay_date: entry.pay_date.iso8601,
              amount_cents: entry.amount,
              covered: paid >= running
            }
          end
        }
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
                   deleted: payment.deleted_at.present?
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
