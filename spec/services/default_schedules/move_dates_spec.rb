# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DefaultSchedules::MoveDates do
  let(:season) { create(:season, year: '2026') }

  before { seed_default_schedules(season) }

  def dates_for(slug)
    DefaultSchedules::Combination.from_slug(slug).entries_in(season.id).order(:pay_date).pluck(:pay_date)
  end

  it 'moves a date in every default that has it, keeping its amount' do
    result = described_class.call(season: season, moves: { Date.new(2025, 11, 14) => Date.new(2025, 11, 21) })

    expect(result.moved).to eq(8)
    expect(dates_for('cc2-visual-vet')).to include(Date.new(2025, 11, 21))
    expect(dates_for('cc2-visual-vet')).not_to include(Date.new(2025, 11, 14))
    moved = DefaultScheduleEntry.find_by(season: season, ensemble: 'World', section_group: 'Music',
                                         vet_status: 'Vet', pay_date: Date.new(2025, 11, 21))
    expect(moved.amount_cents).to eq(36_000)
  end

  it 'leaves a default alone that never paid on the date being moved' do
    visual_only = Date.new(2025, 11, 19)
    DefaultScheduleEntry.create!(season: season, ensemble: 'World', section_group: 'Visual', vet_status: 'Vet',
                                 pay_date: visual_only, amount_cents: 1_000)

    result = described_class.call(season: season, moves: { visual_only => Date.new(2025, 11, 26) })

    expect(result.moved).to eq(1)
    expect(dates_for('world-music-vet')).not_to include(Date.new(2025, 11, 26))
  end

  it 'swaps two dates without tripping over itself' do
    first = Date.new(2025, 10, 17)
    second = Date.new(2025, 11, 14)

    result = described_class.call(season: season, moves: { first => second, second => first })

    expect(result).to be_ok
    row = DefaultScheduleEntry.find_by(season: season, ensemble: 'World', section_group: 'Music',
                                       vet_status: 'Vet', pay_date: second)
    expect(row.amount_cents).to eq(50_000)
  end

  it 'refuses a move that would put two payments of one default on the same day' do
    result = described_class.call(season: season, moves: { Date.new(2025, 11, 14) => Date.new(2025, 12, 12) })

    expect(result.error).to eq('World · Music · Vet would have two payments on 12/12/25.')
    expect(dates_for('world-music-vet')).to include(Date.new(2025, 11, 14))
  end
end
