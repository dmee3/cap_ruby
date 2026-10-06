# frozen_string_literal: true

# Seeds a season with the real 2026 default schedules, which the database only
# holds when a migration imported them into a season that already existed.
module DefaultSchedulesHelpers
  DATES_2026 = [
    Date.new(2025, 10, 17), Date.new(2025, 11, 14), Date.new(2025, 12, 12),
    Date.new(2026, 1, 9), Date.new(2026, 2, 6), Date.new(2026, 3, 6)
  ].freeze

  # [ensemble, section_group, vet_status] => dollars for each payment after the
  # first, which is $500 for everyone.
  INSTALMENTS_2026 = {
    %w[World Music Vet] => 360, %w[World Music Rookie] => 400,
    %w[World Visual Vet] => 300, %w[World Visual Rookie] => 340,
    %w[CC2 Music Vet] => 300, %w[CC2 Music Rookie] => 340,
    %w[CC2 Visual Vet] => 240, %w[CC2 Visual Rookie] => 280
  }.freeze

  def seed_default_schedules(season)
    INSTALMENTS_2026.each do |(ensemble, section_group, vet_status), dollars|
      DATES_2026.each_with_index do |date, i|
        DefaultScheduleEntry.create!(
          season: season, ensemble: ensemble, section_group: section_group, vet_status: vet_status,
          pay_date: date, amount_cents: (i.zero? ? 500 : dollars) * 100
        )
      end
    end
  end
end

RSpec.configure do |config|
  config.include DefaultSchedulesHelpers
end
