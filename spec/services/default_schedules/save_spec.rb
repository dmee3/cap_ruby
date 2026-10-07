# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DefaultSchedules::Save do
  let(:season) { create(:season, year: '2027') }
  let(:combination) { DefaultSchedules::Combination.from_slug('cc2-visual-rookie') }

  def save(entries)
    described_class.call(season: season, combination: combination, entries: entries)
  end

  it 'replaces the combination with exactly the entries given' do
    save([{ pay_date: '2026-10-16', amount_cents: 50_000 }])

    result = save([{ pay_date: '2026-11-13', amount_cents: 28_000 }, { pay_date: '2026-10-16', amount_cents: 45_000 }])

    expect(result).to be_ok
    expect(combination.entries_in(season.id).order(:pay_date).pluck(:pay_date, :amount_cents))
      .to eq([[Date.new(2026, 10, 16), 45_000], [Date.new(2026, 11, 13), 28_000]])
  end

  it 'points at the later of two rows on the same date, and saves nothing' do
    result = save([
                    { pay_date: '2026-10-16', amount_cents: 50_000 },
                    { pay_date: '2026-11-13', amount_cents: 28_000 },
                    { pay_date: '2026-10-16', amount_cents: 28_000 }
                  ])

    expect(result.errors).to eq([{ index: 2, message: 'Payment 1 is already on this date.' }])
    expect(combination.entries_in(season.id)).to be_empty
  end

  it 'refuses a payment with no amount' do
    result = save([{ pay_date: '2026-10-16', amount_cents: 0 }])

    expect(result.errors).to eq([{ index: 0, message: 'Needs an amount.' }])
  end

  it 'refuses to save a default with no payments' do
    expect(save([]).errors.first[:message]).to eq('A default needs at least one payment.')
  end

  it "doesn't touch a member's existing schedule" do
    member = create(:user)
    create(:seasons_user, user: member, season: season, role: 'member', ensemble: 'CC2', section: 'Visual')
    schedule = create(:payment_schedule, user: member, season: season)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2026, 10, 1), amount: 99_900)

    save([{ pay_date: '2026-10-16', amount_cents: 50_000 }])

    expect(schedule.reload.entries.pluck(:amount)).to eq([99_900])
  end
end
