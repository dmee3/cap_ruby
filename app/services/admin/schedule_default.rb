# frozen_string_literal: true

module Admin
  # Resetting a member's payment schedule to the per-year default, preserving
  # entries already covered by a payment. Distinct from
  # `PaymentScheduleService.default_schedule_for` (which just looks the default
  # up) — this compares it against the member's live schedule and only rewrites
  # future, uncovered due dates. Design-system §4.25.
  class ScheduleDefault
    # A per-row diff of the default against the schedule's CURRENT entries plus
    # the default itself as cents entries:
    #
    #   {
    #     entries: [{ pay_date: "2026-01-09", amount_cents: 36000 }, ...],
    #     diff:    [{ pay_date:, kind: "unchanged"|"changed"|"added"|"removed",
    #                 from_cents:, to_cents:, locked: bool }, ...]
    #   }
    #
    # Rows already covered by a payment come back `locked` and never read as
    # `changed` / `removed`. Returns nil when the member has no default schedule.
    def self.preview(schedule, season)
      new(schedule, season).preview
    end

    # Rewrite only the entries NOT covered by a payment: covered entries stay,
    # the uncovered tail is replaced with the default's future dates. Atomic.
    # Returns the resulting entry count, or nil when the member has no default.
    def self.apply(schedule, season)
      new(schedule, season).apply
    end

    def initialize(schedule, season)
      @schedule = schedule
      @season = season
      @default = PaymentScheduleService.default_schedule_for(schedule.user, season)
    end

    def preview
      return nil if @default.nil?

      {
        entries: default_entries.map { |e| { pay_date: e[:pay_date].iso8601, amount_cents: e[:amount_cents] } },
        diff: build_diff,
        # How many entries the reset will leave alone — the reassurance the
        # confirm step leads with.
        locked_count: current_entries.count { |e| covered?(e.pay_date) }
      }
    end

    def apply
      return nil if @default.nil?

      PaymentSchedule.transaction do
        current_entries.reject { |e| covered?(e.pay_date) }.each(&:destroy!)
        default_entries.reject { |e| covered?(e[:pay_date]) }.each do |e|
          @schedule.entries.create!(pay_date: e[:pay_date], amount: e[:amount_cents])
        end
      end
      @schedule.entries.reload.count
    end

    private

    def current_entries
      @current_entries ||= @schedule.entries.sort_by(&:pay_date)
    end

    def default_entries
      @default_entries ||= @default.map do |day, dollars|
        { pay_date: Date.strptime(day, '%m/%d/%y'), amount_cents: dollars * 100 }
      end
    end

    # The latest entry pay_date whose cumulative scheduled amount is fully
    # covered by the member's payments; nil if even the first entry is short-paid.
    def covered_through
      return @covered_through if defined?(@covered_through)

      paid = @schedule.user.amount_paid_for(@season['id'])
      running = 0
      @covered_through = nil
      current_entries.each do |entry|
        running += entry.amount
        break if running > paid

        @covered_through = entry.pay_date
      end
      @covered_through
    end

    def covered?(date)
      !covered_through.nil? && date <= covered_through
    end

    def build_diff
      current_by_date = current_entries.index_by(&:pay_date)
      default_by_date = default_entries.index_by { |e| e[:pay_date] }
      dates = (current_by_date.keys + default_by_date.keys).uniq.sort

      rows = dates.map do |date|
        existing = current_by_date[date]
        incoming = default_by_date[date]
        {
          pay_date: date.iso8601,
          from_date: existing && date.iso8601,
          to_date: incoming && date.iso8601,
          kind: diff_kind(existing, incoming, covered?(date)),
          from_cents: existing&.amount,
          to_cents: incoming&.fetch(:amount_cents),
          locked: covered?(date)
        }
      end

      pair_moves(rows)
    end

    # A date that simply moved reads as a removal plus an addition of the same
    # amount. The canvas shows that as one "3/15 → 3/20" row, which is what it
    # actually is, so fold the pair back together.
    def pair_moves(rows)
      removed = rows.select { |r| r[:kind] == 'removed' && !r[:locked] }
      added = rows.select { |r| r[:kind] == 'added' }
      merged = []

      removed.each do |gone|
        match = added.find { |a| a[:to_cents] == gone[:from_cents] && !merged.include?(a) }
        next if match.nil?

        merged << match
        gone.merge!(kind: 'moved', to_date: match[:to_date], to_cents: match[:to_cents])
      end

      rows - merged
    end

    def diff_kind(existing, incoming, locked)
      return 'unchanged' if locked
      return 'added' if existing.nil?
      return 'removed' if incoming.nil?
      return 'unchanged' if existing.amount == incoming[:amount_cents]

      'changed'
    end
  end
end
