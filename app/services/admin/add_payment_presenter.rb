# frozen_string_literal: true

module Admin
  # Per-member view-model for /admin/payments/new. Carries everything the
  # projection panel and the member's-schedule panel need, so switching member
  # in the form never costs a round-trip.
  class AddPaymentPresenter
    class << self
      def members_for(season)
        season_id = season['id']
        User.members_for_season(season_id)
            .with_payments
            .order(:last_name, :first_name)
            .map { |member| member_model(member, season_id) }
      end

      private

      def member_model(member, season_id)
        summary = PaymentService.member_dues_summary(member, season_id)
        schedule = member.payment_schedule_for(season_id)
        remaining = summary[:remaining_installments] || []

        {
          id: member.id,
          name: member.full_name,
          section: [member.ensemble_for(season_id), member.section_for(season_id)].compact.join(' / '),
          paid_before_cents: summary[:paid],
          season_total_cents: summary[:total],
          expected_cents: summary[:expected],
          applies_to: remaining.first(2).map { |e| e[:pay_date].iso8601 },
          schedule_id: schedule&.id,
          installments: installments(schedule, summary[:paid])
        }
      end

      # Every entry with a derived paid flag, so the panel can show which ones
      # this payment will land against without recomputing client-side.
      def installments(schedule, paid_cents)
        return [] if schedule.nil?

        running = 0
        schedule.entries.sort_by(&:pay_date).map do |entry|
          running += entry.amount
          {
            pay_date: entry.pay_date.iso8601,
            amount_cents: entry.amount,
            paid: paid_cents >= running
          }
        end
      end
    end
  end
end
