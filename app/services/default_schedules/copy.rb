# frozen_string_literal: true

module DefaultSchedules
  # Copies a source season's defaults into a target season, moving every date
  # by a whole number of weeks. Only combinations the target doesn't have yet
  # are created: an existing default is changed by editing it, never by copying
  # over it. Amounts copy unchanged.
  class Copy
    Result = Struct.new(:created, :error, keyword_init: true) do
      def ok?
        error.nil?
      end
    end

    MAX_SHIFT_WEEKS = 104

    def self.call(source:, target:, shift_weeks:)
      new(source: source, target: target, shift_weeks: shift_weeks).call
    end

    def initialize(source:, target:, shift_weeks:)
      @source = source
      @target = target
      @shift_weeks = shift_weeks
    end

    def call
      error = validation_error
      return Result.new(created: [], error: error) if error

      created = []
      DefaultScheduleEntry.transaction do
        missing.each do |combination|
          combination.entries_in(@source.id).each do |row|
            DefaultScheduleEntry.create!(
              season: @target, **combination.to_h,
              pay_date: row.pay_date + @shift_weeks.weeks, amount_cents: row.amount_cents
            )
          end
          created << combination.slug
        end
      end
      Result.new(created: created, error: nil)
    end

    private

    def validation_error
      return 'Choose a season to copy from.' if @source.nil?
      return "Can't copy a season into itself." if @source.id == @target.id
      return "Move dates by a whole number of weeks, up to #{MAX_SHIFT_WEEKS}." unless valid_shift?
      return "The #{@source.year} season has no defaults to copy." if source_combinations.empty?
      return "#{@target.year} already has every default #{@source.year} has." if missing.empty?

      nil
    end

    def valid_shift?
      @shift_weeks.is_a?(Integer) && @shift_weeks.abs <= MAX_SHIFT_WEEKS
    end

    def source_combinations
      @source_combinations ||= Combination.all.select { |c| c.entries_in(@source.id).exists? }
    end

    def missing
      @missing ||= source_combinations.reject { |c| c.entries_in(@target.id).exists? }
    end
  end
end
