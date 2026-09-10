# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::ScheduleEditorPresenter do
  let(:season) { create(:season, year: '2026') }
  let(:user) { create(:user, first_name: 'Sam', last_name: 'Reed') }
  let(:schedule) { create(:payment_schedule, season: season, user: user) }

  before do
    create(:seasons_user, user: user, season: season, role: 'member', ensemble: 'World', section: 'Snare')
  end

  def present
    described_class.call(schedule.reload, season)
  end

  it 'reports member context and the paid / planned totals' do
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 5.days, amount: 30_000)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current + 20.days, amount: 20_000)
    create(:payment, user: user, season: season, amount: 10_000, date_paid: Date.current - 2.days)

    result = present
    expect(result[:member]).to include(name: 'Sam Reed', ensemble: 'World', section: 'Snare', vet: false)
    expect(result[:paid_cents]).to eq(10_000)
    expect(result[:planned_cents]).to eq(50_000)
  end

  it 'carries the season label and a display member type' do
    result = present
    expect(result[:season_label]).to eq('2026')
    expect(result[:member]).to include(member_type: 'New member')
  end

  it 'counts how many entries a reset would leave alone' do
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 30.days, amount: 20_000)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current + 30.days, amount: 20_000)
    create(:payment, user: user, season: season, amount: 20_000, date_paid: Date.current - 25.days)

    expect(present[:locked_count]).to eq(1)
  end

  it 'reports whether the schedule is still the untouched per-year default' do
    expect(present[:matches_default]).to be(false)

    PaymentScheduleService.default_schedule_for(user, season).each do |day, dollars|
      create(:payment_schedule_entry, payment_schedule: schedule,
                                      pay_date: Date.strptime(day, '%m/%d/%y'), amount: dollars * 100)
    end

    expect(present[:matches_default]).to be(true)
  end

  it 'names the date a covered entry was actually paid' do
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 10, 17), amount: 20_000)
    create(:payment, user: user, season: season, amount: 20_000, date_paid: Date.new(2025, 10, 18))

    expect(present[:entries].first[:covered_on]).to eq('10/18')
  end

  it 'derives per-entry status from the running payment total' do
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 30.days, amount: 20_000)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 3.days, amount: 20_000)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current + 10.days, amount: 20_000)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current + 40.days, amount: 20_000)
    create(:payment, user: user, season: season, amount: 20_000, date_paid: Date.current - 25.days)

    statuses = present[:entries].map { |e| e[:status] }
    expect(statuses).to eq(%w[paid late due-next not-due])
    late = present[:entries][1]
    expect(late[:days_late]).to eq(3)
  end
end
