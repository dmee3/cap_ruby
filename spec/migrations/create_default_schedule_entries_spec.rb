# frozen_string_literal: true

require 'rails_helper'
require Rails.root.join('db/migrate/20261006120000_create_default_schedule_entries')

# The imported hash was in dollars and the table is in cents, so a slip here
# bills every member 100x too much or too little.
RSpec.describe CreateDefaultScheduleEntries do
  let(:migration) { described_class.new.tap { |m| m.verbose = false } }

  it 'imports the hardcoded defaults as cents on real dates' do
    season = create(:season, year: '2026')

    migration.send(:import_defaults)

    rows = DefaultScheduleEntry.where(season: season, ensemble: 'World', section_group: 'Music', vet_status: 'Vet')
                               .order(:pay_date)
    expect(rows.map(&:pay_date).first).to eq(Date.new(2025, 10, 17))
    expect(rows.map(&:amount_cents)).to eq([50_000, 36_000, 36_000, 36_000, 36_000, 36_000])
    expect(DefaultScheduleEntry.where(season: season).count).to eq(48)
  end

  it 'skips a year whose season is not in the database' do
    expect { migration.send(:import_defaults) }.not_to change(DefaultScheduleEntry, :count)
  end
end
