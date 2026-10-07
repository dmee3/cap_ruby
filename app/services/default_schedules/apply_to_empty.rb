# frozen_string_literal: true

module DefaultSchedules
  # Fills the schedule of every member in a season whose schedule has no
  # entries, from the default for their combination. A schedule with even one
  # entry is left alone, so nobody's customised plan is touched.
  class ApplyToEmpty
    Result = Struct.new(:filled, :still_empty, keyword_init: true)

    def self.call(season)
      new(season).call
    end

    def initialize(season)
      @season = season
    end

    def call
      filled = 0
      still_empty = 0
      PaymentScheduleService.blank_schedule_members(@season.id).each do |member|
        schedule = member.payment_schedule_for(@season.id) ||
                   PaymentSchedule.create!(user: member, season: @season)
        if PaymentScheduleService.populate_from_default(schedule, @season).positive?
          filled += 1
        else
          still_empty += 1
        end
      end
      Result.new(filled: filled, still_empty: still_empty)
    end
  end
end
