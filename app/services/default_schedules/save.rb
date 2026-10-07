# frozen_string_literal: true

module DefaultSchedules
  # Replaces one combination's entries in a season with the ones given, all or
  # nothing. Errors are per row so the editor can point at the one to fix.
  class Save
    Result = Struct.new(:errors, keyword_init: true) do
      def ok?
        errors.empty?
      end
    end

    def self.call(season:, combination:, entries:)
      new(season: season, combination: combination, entries: entries).call
    end

    def initialize(season:, combination:, entries:)
      @season = season
      @combination = combination
      @entries = entries.map { |e| { pay_date: parse_date(e[:pay_date]), amount_cents: parse_cents(e[:amount_cents]) } }
    end

    def call
      errors = validation_errors
      return Result.new(errors: errors) if errors.any?

      DefaultScheduleEntry.transaction do
        @combination.entries_in(@season.id).delete_all
        @entries.each do |entry|
          DefaultScheduleEntry.create!(season: @season, **@combination.to_h, **entry)
        end
      end
      Result.new(errors: [])
    end

    private

    def validation_errors
      return [{ index: nil, message: 'A default needs at least one payment.' }] if @entries.empty?

      dates = @entries.map { |e| e[:pay_date] }
      @entries.each_with_index.filter_map do |entry, i|
        message = row_error(entry, dates, i)
        { index: i, message: message } if message
      end
    end

    def row_error(entry, dates, index)
      return 'Enter a due date, or remove this payment.' if entry[:pay_date].nil?
      return 'Enter an amount over $0, or remove this payment.' unless entry[:amount_cents]&.positive?

      first = dates.index(entry[:pay_date])
      if first < index
        return "#{entry[:pay_date].strftime('%-m/%-d/%y')} is already payment #{first + 1}. " \
               'Pick another date or remove one.'
      end

      nil
    end

    def parse_date(value)
      Date.iso8601(value.to_s)
    rescue Date::Error
      nil
    end

    def parse_cents(value)
      Integer(value, exception: false)
    end
  end
end
