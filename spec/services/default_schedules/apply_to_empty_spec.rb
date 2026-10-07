# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DefaultSchedules::ApplyToEmpty do
  let(:season) { create(:season, year: '2026') }

  before { seed_default_schedules(season) }

  def member(ensemble: 'World', section: 'Snare')
    create(:user).tap do |u|
      create(:seasons_user, user: u, season: season, role: 'member', ensemble: ensemble, section: section)
    end
  end

  it "fills empty schedules from each member's default and leaves any schedule with entries alone" do
    empty = member
    create(:payment_schedule, user: empty, season: season)
    customised = member(ensemble: 'CC2', section: 'Visual')
    schedule = create(:payment_schedule, user: customised, season: season)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 10, 1), amount: 1_000)

    result = described_class.call(season)

    expect(result.filled).to eq(1)
    expect(empty.reload.payment_schedule_for(season.id).entries.sum(:amount)).to eq(250_000)
    expect(schedule.reload.entries.pluck(:amount)).to eq([1_000])
  end

  it 'creates the schedule for a member who has none' do
    nobody = member

    described_class.call(season)

    expect(nobody.reload.payment_schedule_for(season.id).entries.count).to eq(6)
  end

  it 'counts the members it could not fill because their combination has no default' do
    DefaultScheduleEntry.where(season: season, ensemble: 'CC2').delete_all
    create(:payment_schedule, user: member(ensemble: 'CC2'), season: season)

    result = described_class.call(season)

    expect(result).to have_attributes(filled: 0, still_empty: 1)
  end
end
