# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::AddPaymentPresenter do
  let(:season) { create(:season, year: '2026') }
  let(:member) { create(:user, first_name: 'Elena', last_name: 'Sokol') }

  before do
    create(:seasons_user, user: member, season: season, role: 'member',
                          ensemble: 'Front Ensemble', section: 'Vibes')
  end

  def model
    described_class.members_for(season).find { |m| m[:id] == member.id }
  end

  it 'names members first-last with their section, for the picker' do
    expect(model).to include(name: 'Elena Sokol', section: 'Front Ensemble / Vibes')
  end

  it 'still orders the roster by last name, whatever the display format' do
    create(:user, first_name: 'Aaron', last_name: 'Zeller').tap do |u|
      create(:seasons_user, user: u, season: season, role: 'member')
    end
    create(:user, first_name: 'Zoe', last_name: 'Abbott').tap do |u|
      create(:seasons_user, user: u, season: season, role: 'member')
    end

    names = described_class.members_for(season).map { |m| m[:name] }
    expect(names).to eq(names.sort_by { |n| n.split.last })
  end

  it 'carries the projection figures' do
    schedule = create(:payment_schedule, season: season, user: member)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 1.day, amount: 30_000)
    create(:payment, user: member, season: season, amount: 10_000, date_paid: Date.current)

    expect(model).to include(paid_before_cents: 10_000, season_total_cents: 30_000, expected_cents: 30_000)
  end

  it 'flags which installments a running payment total has already covered' do
    schedule = create(:payment_schedule, season: season, user: member)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 10, 17), amount: 20_000)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 11, 14), amount: 20_000)
    create(:payment, user: member, season: season, amount: 20_000, date_paid: Date.new(2025, 10, 18))

    expect(model[:installments]).to eq(
      [
        { pay_date: '2025-10-17', amount_cents: 20_000, paid: true },
        { pay_date: '2025-11-14', amount_cents: 20_000, paid: false }
      ]
    )
  end

  it 'lists the next two unpaid due dates as the applies-to hint' do
    schedule = create(:payment_schedule, season: season, user: member)
    [Date.new(2026, 3, 15), Date.new(2026, 4, 15), Date.new(2026, 5, 15)].each do |d|
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: d, amount: 20_000)
    end

    expect(model[:applies_to]).to eq(%w[2026-03-15 2026-04-15])
  end

  it 'copes with a member who has no schedule at all' do
    expect(model).to include(schedule_id: nil, installments: [], season_total_cents: 0)
  end
end
