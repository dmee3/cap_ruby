# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DefaultSchedules::Copy do
  let(:source) { create(:season, year: '2026') }
  let(:target) { create(:season, year: '2027') }

  before { seed_default_schedules(source) }

  it 'copies every default forward, moving dates by whole weeks and keeping amounts in cents' do
    result = described_class.call(source: source, target: target, shift_weeks: 52)

    expect(result.created.size).to eq(8)
    rows = DefaultSchedules::Combination.from_slug('world-music-vet').entries_in(target.id).order(:pay_date)
    # +52 weeks keeps the weekday: Fri 10/17/25 lands on Fri 10/16/26.
    expect(rows.first.pay_date).to eq(Date.new(2026, 10, 16))
    expect(rows.map(&:amount_cents)).to eq([50_000, 36_000, 36_000, 36_000, 36_000, 36_000])
  end

  it 'creates only the combinations the target is missing and leaves the rest as edited' do
    DefaultScheduleEntry.create!(season: target, ensemble: 'World', section_group: 'Music', vet_status: 'Vet',
                                 pay_date: Date.new(2026, 11, 20), amount_cents: 12_300)

    result = described_class.call(source: source, target: target, shift_weeks: 52)

    expect(result.created).not_to include('world-music-vet')
    expect(result.created.size).to eq(7)
    kept = DefaultSchedules::Combination.from_slug('world-music-vet').entries_in(target.id)
    expect(kept.pluck(:pay_date, :amount_cents)).to eq([[Date.new(2026, 11, 20), 12_300]])
  end

  it 'refuses when there is nothing left to copy' do
    described_class.call(source: source, target: target, shift_weeks: 52)

    result = described_class.call(source: source, target: target, shift_weeks: 52)

    expect(result).not_to be_ok
    expect(result.error).to eq('2027 already has every default 2026 has.')
  end
end
