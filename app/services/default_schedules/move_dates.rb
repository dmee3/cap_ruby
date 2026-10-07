# frozen_string_literal: true

module DefaultSchedules
  # Moves due dates across every default in a season that has them, and
  # nowhere else. Amounts don't change, and neither does any member's schedule.
  class MoveDates
    Result = Struct.new(:moved, :error, keyword_init: true) do
      def ok?
        error.nil?
      end
    end

    # moves: { from Date => to Date }
    def self.call(season:, moves:)
      new(season: season, moves: moves).call
    end

    def initialize(season:, moves:)
      @season = season
      @moves = moves.reject { |from, to| from == to }
    end

    def call
      return Result.new(moved: 0, error: nil) if @moves.empty?

      clash = first_clash
      return Result.new(moved: 0, error: clash) if clash

      affected = rows.select { |row| @moves.key?(row.pay_date) }
      DefaultScheduleEntry.transaction do
        # Deleted first and re-created, so swapping two dates never trips the
        # unique index on a row that hasn't moved yet.
        DefaultScheduleEntry.where(id: affected.map(&:id)).delete_all
        affected.each do |row|
          DefaultScheduleEntry.create!(
            row.attributes.slice('season_id', 'ensemble', 'section_group', 'vet_status', 'amount_cents')
               .merge(pay_date: @moves.fetch(row.pay_date))
          )
        end
      end
      Result.new(moved: affected.size, error: nil)
    end

    private

    def rows
      @rows ||= DefaultScheduleEntry.where(season: @season).to_a
    end

    def first_clash
      rows.group_by { |row| [row.ensemble, row.section_group, row.vet_status] }.each do |key, combo_rows|
        after = combo_rows.map { |row| @moves.fetch(row.pay_date, row.pay_date) }
        dupe = after.detect { |date| after.count(date) > 1 }
        next unless dupe

        return "#{key.join(' · ')} would have two payments on #{dupe.strftime('%-m/%-d/%y')}."
      end
      nil
    end
  end
end
