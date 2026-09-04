# frozen_string_literal: true

module Members
  class DashboardController < MembersController
    def index
      season_id = current_season['id']

      @conflicts = current_user
                   .conflicts
                   .includes(:conflict_status)
                   .for_season(season_id)
                   .order(:start_date)

      @dues = PaymentService.member_dues_summary(current_user, season_id)
      @timeline = build_timeline(season_id)
      @ensemble = current_user.ensemble_for(season_id)
      @section = current_user.section_for(season_id)

      @next_event = EventService.next_event(season_id)
    end

    private

    # Reconciles paid history and remaining installments into one chronological
    # list the DuesTimeline widget renders. All amounts in integer cents.
    def build_timeline(season_id)
      paid_rows = current_user.payments_for(season_id).sort_by(&:date_paid).map do |p|
        {
          kind: 'paid',
          date: format_row_date(p.date_paid),
          amount_cents: p.amount,
          method: p.payment_type.name,
          subline: paid_subline(p)
        }
      end

      return { paid: paid_rows, upcoming: [] } if @dues[:state] == :no_schedule

      past_due_remaining = @dues[:past_due]
      upcoming_rows = @dues[:remaining_installments].each_with_index.map do |entry, i|
        is_past_due = entry[:pay_date] < Date.current && past_due_remaining.positive?
        {
          kind: is_past_due ? 'past-due' : 'upcoming',
          date: format_row_date(entry[:pay_date]),
          amount_cents: entry[:amount],
          installment_chip: entry[:pay_date].day.to_s,
          subline: upcoming_subline(entry, i, @dues[:remaining_installments].length, is_past_due)
        }
      end

      { paid: paid_rows, upcoming: upcoming_rows }
    end

    def format_row_date(date)
      within_two_weeks = (date - Date.current).abs <= 14
      within_two_weeks ? date.strftime('%a %-m/%-d/%y') : date.strftime('%-m/%-d/%y')
    end

    def paid_subline(payment)
      return 'No fee' unless payment.payment_type.name == 'Stripe'

      fee = StripeFees.fee_cents(payment.amount)
      "Card · #{ActiveSupport::NumberHelper.number_to_currency(fee / 100.0)} fee on top"
    end

    def upcoming_subline(entry, index, count, is_past_due)
      if is_past_due
        days = (Date.current - entry[:pay_date]).to_i
        "#{days} #{'day'.pluralize(days)} past due"
      elsif entry[:pay_date] >= Date.current
        days = (entry[:pay_date] - Date.current).to_i
        base = days <= 14 ? "Due in #{days} #{'day'.pluralize(days)}" : 'Upcoming'
        index == count - 1 ? 'Final installment' : "#{base} · installment #{index + 1} of #{count}"
      else
        "Installment #{index + 1} of #{count}"
      end
    end
  end
end
