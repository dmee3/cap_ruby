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
