# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DefaultSchedules::Overview do
  let(:season) { create(:season, year: '2027') }

  def member(ensemble:, section:, vet: false)
    create(:user).tap do |u|
      create(:seasons_user, user: u, season: create(:season, year: '2020'), role: 'member') if vet
      create(:seasons_user, user: u, season: season, role: 'member', ensemble: ensemble, section: section)
    end
  end

  it 'puts each member in their combination and counts the ones with an empty schedule' do
    member(ensemble: 'World', section: 'Tenors', vet: true)
    member(ensemble: 'World', section: 'Metals', vet: true)
    member(ensemble: 'World', section: 'Visual')

    overview = described_class.call(season)

    combos = overview[:combinations].index_by { |c| c[:slug] }
    expect(combos['world-music-vet']).to include(member_count: 2, blank_schedule_count: 2, set_up: false)
    expect(combos['world-visual-rookie']).to include(member_count: 1)
    expect(overview).to include(member_count: 3, blank_schedule_count: 3, set_up_count: 0)
  end

  it 'offers the newest earlier season with defaults as the one to copy from' do
    seed_default_schedules(create(:season, year: '2025'))
    seed_default_schedules(create(:season, year: '2026'))

    source = described_class.call(season)[:copy_source]

    expect(source).to include(year: '2026', combination_count: 8, min_total_cents: 170_000,
                              max_total_cents: 250_000, payment_count: 6)
  end

  it "lists the union of every default's dates, since combinations need not share them" do
    DefaultScheduleEntry.create!(season: season, ensemble: 'World', section_group: 'Music', vet_status: 'Vet',
                                 pay_date: Date.new(2026, 10, 16), amount_cents: 50_000)
    DefaultScheduleEntry.create!(season: season, ensemble: 'World', section_group: 'Visual', vet_status: 'Vet',
                                 pay_date: Date.new(2026, 10, 23), amount_cents: 50_000)

    expect(described_class.call(season)[:dates]).to eq(%w[2026-10-16 2026-10-23])
  end
end
