# frozen_string_literal: true

module Admin
  # What a member's schedule *would* be, for a combination that may not exist
  # yet. The add/edit user form needs this while the admin is still typing —
  # before there is a User, a SeasonsUser or a PaymentSchedule to look up.
  #
  # Distinct from Admin::ScheduleDefault, which diffs the default against a
  # member's live schedule and needs both records to exist. This one takes the
  # four things the lookup actually keys on and creates nothing.
  class ScheduleForecast
    # nil when there is no default row for this combination — which is the live
    # case for any season past 2026, since DEFAULT_PAYMENT_SCHEDULES is a
    # hardcoded per-year hash.
    def self.call(season:, ensemble:, section:, vet:)
      new(season: season, ensemble: ensemble, section: section, vet: vet).call
    end

    def initialize(season:, ensemble:, section:, vet:)
      @season = season
      @ensemble = ensemble
      @section = section
      @vet = vet
    end

    def call
      return nil if @season.nil? || @ensemble.blank? || @section.blank?

      default = PaymentScheduleService.singleton_class::DEFAULT_PAYMENT_SCHEDULES
                .dig(@season.year, @ensemble, lookup_section, vet_status)
      return nil if default.nil?

      entries = PaymentScheduleService.default_entries(default)
      {
        entries: entries.map { |e| { pay_date: e[:pay_date].iso8601, amount_cents: e[:amount_cents] } },
        total_cents: entries.sum { |e| e[:amount_cents] },
        # The panel leads with this, and it is Visual/Music — never "Battery",
        # whatever the canvas says. The lookup has no battery bucket.
        lookup_key: [@ensemble, lookup_section, vet_status].join(' · '),
        past_due: past_due(entries)
      }
    end

    private

    # Every non-Visual section keys to Music.
    def lookup_section
      @section == 'Visual' ? 'Visual' : 'Music'
    end

    def vet_status
      @vet ? 'Vet' : 'Rookie'
    end

    # Entries whose due date has already gone by read as owed the moment the
    # member is created, which the form warns about rather than silently fixing.
    def past_due(entries)
      past = entries.select { |e| e[:pay_date] < Date.current }
      { count: past.size, amount_cents: past.sum { |e| e[:amount_cents] } }
    end
  end
end
