# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DuesBreakdown do
  let(:season) { create(:season, year: '2026') }
  let(:payment_type) { create(:payment_type) }
  # After the first two default due dates: $500 + $360 for World Music Vet.
  let(:on) { Date.new(2025, 11, 20) }

  before { seed_default_schedules(season) }

  def member(ensemble: 'World', section: 'Snare', vet: true)
    create(:user).tap do |u|
      create(:seasons_user, user: u, season: create(:season, year: '2025'), role: 'member') if vet
      create(:seasons_user, user: u, season: season, role: 'member', ensemble: ensemble, section: section)
    end
  end

  def schedule(user, entries)
    create(:payment_schedule, user: user, season: season).tap do |s|
      entries.each { |date, cents| create(:payment_schedule_entry, payment_schedule: s, pay_date: date, amount: cents) }
    end
  end

  def default_entries
    DefaultScheduleEntry.where(season: season, ensemble: 'World', section_group: 'Music', vet_status: 'Vet')
                        .order(:pay_date).map { |r| [r.pay_date, r.amount_cents] }
  end

  def pay(user, cents)
    create(:payment, user: user, season: season, amount: cents, payment_type: payment_type, date_paid: on)
  end

  def world
    described_class.call(season.id, on: on).find { |r| r[:ensemble] == 'World' }
  end

  it 'measures each member against their own schedule, so early money offsets what others owe' do
    behind = member
    schedule(behind, default_entries)
    pay(behind, 50_000)
    ahead = member
    schedule(ahead, default_entries)
    pay(ahead, 100_000)

    expect(world).to include(behind_count: 1, behind_cents: 36_000, ahead_count: 1, ahead_cents: 14_000,
                             due_cents: 172_000, collected_cents: 150_000)
  end

  it 'counts a schedule that differs from the default by even one date as custom, and compares what each has due' do
    on_default = member
    schedule(on_default, default_entries)
    moved = member
    schedule(moved, default_entries.map.with_index { |(date, cents), i| [i == 1 ? date + 14.days : date, cents] })

    expect(world).to include(custom_count: 1, default_due_cents: 172_000, due_cents: 136_000)
  end

  it "uses a member's own schedule for the default figure when their group has no default" do
    DefaultScheduleEntry.where(season: season, ensemble: 'World').delete_all
    orphan = member
    schedule(orphan, [[Date.new(2025, 10, 1), 40_000]])

    expect(world).to include(no_default_count: 1, custom_count: 0, default_due_cents: 40_000, due_cents: 40_000)
  end
end
