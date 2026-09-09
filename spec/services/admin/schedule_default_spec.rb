# frozen_string_literal: true

require 'rails_helper'

# The default for a 2026 World Music rookie: 10/17/25 $500, then
# 11/14/25 12/12/25 1/09/26 2/06/26 3/06/26 at $400 each.
RSpec.describe Admin::ScheduleDefault do
  let(:season) { create(:season, year: '2026') }
  let(:user) { create(:user) }
  let(:schedule) { create(:payment_schedule, season: season, user: user) }

  before do
    create(:seasons_user, user: user, season: season, role: 'member', ensemble: 'World', section: 'Snare')
  end

  describe '.preview' do
    it 'reports added / changed / unchanged rows against the current entries' do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 10, 17), amount: 50_000)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 11, 14), amount: 99_900)

      diff = described_class.preview(schedule.reload, season)[:diff]

      by_date = diff.index_by { |row| row[:pay_date] }
      expect(by_date['2025-10-17'][:kind]).to eq('unchanged')
      expect(by_date['2025-11-14']).to include(kind: 'changed', from_cents: 99_900, to_cents: 40_000)
      expect(by_date['2026-03-06'][:kind]).to eq('added')
    end

    it 'locks entries already covered by a payment so they never read as changed' do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 10, 17), amount: 99_900)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 11, 14), amount: 99_900)
      create(:payment, user: user, season: season, amount: 99_900, date_paid: Date.new(2025, 10, 18))

      diff = described_class.preview(schedule.reload, season)[:diff]
      locked_row = diff.find { |row| row[:pay_date] == '2025-10-17' }

      expect(locked_row).to include(locked: true, kind: 'unchanged')
    end

    it 'returns nil when the member has no default schedule' do
      orphan = create(:payment_schedule, season: season, user: create(:user))
      expect(described_class.preview(orphan, season)).to be_nil
    end
  end

  describe '.apply' do
    it 'replaces uncovered future entries but leaves paid ones untouched' do
      paid_entry = create(:payment_schedule_entry, payment_schedule: schedule,
                                                   pay_date: Date.new(2025, 10, 17), amount: 12_345)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2026, 6, 1), amount: 77_700)
      create(:payment, user: user, season: season, amount: 12_345, date_paid: Date.new(2025, 10, 18))

      described_class.apply(schedule.reload, season)
      schedule.reload

      expect(schedule.entries.find_by(id: paid_entry.id).amount).to eq(12_345)
      expect(schedule.entries.map(&:pay_date)).not_to include(Date.new(2026, 6, 1))
      expect(schedule.entries.where(pay_date: Date.new(2026, 3, 6)).pluck(:amount)).to eq([40_000])
    end

    it 'rebuilds every entry when none are covered by a payment' do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2020, 1, 1), amount: 111)

      described_class.apply(schedule.reload, season)

      expect(schedule.reload.entries.count).to eq(6)
      expect(schedule.entries.order(:pay_date).first.amount).to eq(50_000)
    end

    it 'rolls the whole change back if an entry write fails' do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2026, 6, 1), amount: 5000)
      allow_any_instance_of(PaymentSchedule).to receive(:entries).and_wrap_original do |orig|
        rel = orig.call
        allow(rel).to receive(:create!).and_raise(ActiveRecord::RecordInvalid)
        rel
      end

      expect { described_class.apply(schedule, season) }.to raise_error(ActiveRecord::RecordInvalid)
      expect(schedule.reload.entries.pluck(:pay_date)).to eq([Date.new(2026, 6, 1)])
    end

    it 'returns nil when the member has no default schedule' do
      orphan = create(:payment_schedule, season: season, user: create(:user))
      expect(described_class.apply(orphan, season)).to be_nil
    end
  end
end
