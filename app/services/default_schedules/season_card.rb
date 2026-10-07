# frozen_string_literal: true

module DefaultSchedules
  # The "Default payment schedules" card on /admin/season. Its tone follows
  # setup: danger with nothing set up, warning while combinations are missing or
  # members still have empty schedules, neutral once everything is in place.
  class SeasonCard
    def self.call(overview)
      new(overview).call
    end

    def initialize(overview)
      @overview = overview
      @year = overview[:season][:year]
      @combinations = overview[:combinations]
      @missing = @combinations.reject { |c| c[:set_up] }
    end

    def call
      base = { pill: "#{@overview[:set_up_count]} of #{@combinations.size}", missing: [] }
      return base.merge(nothing_set_up) if @overview[:set_up_count].zero?
      return base.merge(partly_set_up) if @missing.any?
      return base.merge(empty_schedules_remain) if @overview[:blank_schedule_count].positive?

      base.merge(all_set_up)
    end

    private

    def nothing_set_up
      blank = @overview[:blank_schedule_count]
      {
        tone: 'danger',
        headline: blank.positive? ? "#{members(blank)} no payment schedule" : "No #{@year} defaults yet",
        body: if blank.positive?
                "There are no #{@year} defaults, so everyone added this season got an empty schedule."
              else
                'Set them up before adding members, or everyone added gets an empty schedule.'
              end,
        cta: { label: "Set up #{@year} defaults", primary: true }
      }
    end

    def partly_set_up
      blank = @missing.sum { |c| c[:blank_schedule_count] }
      pair = @missing.map { |c| [c[:ensemble], c[:section_group]] }.uniq
      cta = { label: "Finish #{@year} defaults →", primary: false }

      if @missing.size == 1 || pair.size == 1
        name = @missing.size == 1 ? @missing.first[:label] : pair.first.join(' · ')
        return { tone: 'warning', headline: "#{name} isn't set up", body: missing_body(blank), cta: cta }
      end

      {
        tone: 'warning',
        headline: "#{members(blank)} no payment schedule",
        body: "#{@missing.size} combinations aren't set up for #{@year}:",
        missing: @missing.map { |c| { label: c[:label], member_count: c[:member_count] } },
        cta: cta
      }
    end

    def missing_body(blank)
      return 'Nobody is in it yet.' if blank.zero?

      split = @missing.select { |c| c[:blank_schedule_count].positive? }
                      .map { |c| "#{c[:blank_schedule_count]} #{c[:vet_status]}" }
      detail = split.size > 1 ? " (#{split.join(', ')})" : ''
      "#{blank} #{'member'.pluralize(blank)}#{detail} #{blank == 1 ? 'has' : 'have'} no payment schedule."
    end

    def empty_schedules_remain
      blank = @overview[:blank_schedule_count]
      {
        tone: 'warning',
        headline: "#{blank} #{'member'.pluralize(blank)} still #{blank == 1 ? 'has' : 'have'} an empty schedule",
        body: "All #{@combinations.size} defaults are set up for #{@year}. Fill those schedules from them.",
        cta: { label: 'Fill empty schedules →', primary: false }
      }
    end

    def all_set_up
      totals = @combinations.map { |c| c[:total_cents] }
      dates = @overview[:dates].map { |d| Date.iso8601(d) }
      {
        tone: 'neutral',
        headline: "All #{@combinations.size} set up for #{@year}",
        body: "#{money(totals.min)} to #{money(totals.max)} per member · " \
              "#{dates.size} #{'payment'.pluralize(dates.size)}, #{short(dates.first)} – #{short(dates.last)}",
        cta: { label: 'Manage defaults →', primary: false }
      }
    end

    def members(count)
      "#{count} #{'member'.pluralize(count)} #{count == 1 ? 'has' : 'have'}"
    end

    def money(cents)
      ActiveSupport::NumberHelper.number_to_currency(cents / 100, precision: 0)
    end

    def short(date)
      date.strftime('%-m/%-d/%y')
    end
  end
end
