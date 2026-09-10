# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::Member360Presenter do
  let(:season) { create(:season, year: '2026') }
  let(:prior_season) { create(:season, year: '2025') }
  let(:user) { create(:user, first_name: 'Nina', last_name: 'Park', username: 'ninap') }

  before do
    create(:seasons_user, user: user, season: season, role: 'member', ensemble: 'World', section: 'Snare')
  end

  def present
    described_class.call(user.reload, season)
  end

  it 'builds the identity block and season label from the season in context' do
    result = present
    expect(result[:season_label]).to eq('2026')
    expect(result[:identity]).to include(
      name: 'Nina Park', username: 'ninap', ensemble: 'World', section: 'Snare', role: 'Member'
    )
  end

  it 'describes a first-year member as new and a returning one by season count' do
    expect(present[:identity][:member_type]).to eq('New member')

    create(:seasons_user, user: user, season: prior_season, role: 'member')
    expect(present[:identity][:member_type]).to eq('Vet · 2nd season')
  end

  it 'derives a status and label for every schedule entry' do
    schedule = create(:payment_schedule, season: season, user: user)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 10, 17), amount: 20_000)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 3.days, amount: 20_000)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current + 5.days, amount: 20_000)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current + 40.days, amount: 20_000)
    create(:payment, user: user, season: season, amount: 20_000, date_paid: Date.new(2025, 10, 18))

    entries = present[:schedule][:entries]
    expect(entries.map { |e| e[:status] }).to eq(%w[paid late due-next not-due])
    expect(entries[0][:status_label]).to eq('Paid 10/18')
    expect(entries[1][:status_label]).to eq('3 days late')
    expect(entries[3][:status_label]).to eq('Upcoming')
  end

  it 'summarises live payments for the card header, ignoring deleted ones' do
    create(:payment, user: user, season: season, amount: 10_000, date_paid: Date.current - 2.days)
    create(:payment, user: user, season: season, amount: 5000, date_paid: Date.current - 1.day).destroy

    expect(present[:payments_summary]).to eq(count: 1, total_cents: 10_000)
  end

  it 'gives each payment row an edit and restore path' do
    payment = create(:payment, user: user, season: season, amount: 10_000, date_paid: Date.current)

    row = present[:payment_rows].first
    expect(row[:edit_href]).to eq("/admin/payments/#{payment.id}/edit")
    expect(row[:restore_href]).to eq("/admin/payments/restore/#{payment.id}")
  end

  it 'joins the conflict reason and relative time into one subline' do
    status = create(:conflict_status, name: 'Pending')
    create(:conflict, user: user, season: season, conflict_status: status,
                      start_date: 5.days.from_now, end_date: 6.days.from_now, reason: 'Closing shift')

    row = present[:conflict_rows].first
    expect(row[:relative_subline]).to match(/Closing shift · in 5 days/)
    expect(row).not_to have_key(:reason)
  end

  it 'uses PaymentService.member_dues_summary for dues (state, cents)' do
    schedule = create(:payment_schedule, season: season, user: user)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 1.day, amount: 30_000)
    create(:payment, user: user, season: season, amount: 10_000, date_paid: Date.current)

    expect(present[:dues]).to include(state: :behind, paid: 10_000, past_due: 20_000)
  end

  describe 'roles_by_season' do
    it 'lists only the seasons the user was a member, newest first' do
      create(:seasons_user, user: user, season: prior_season, role: 'member', ensemble: 'CC2', section: 'Tenors')

      years = present[:roles_by_season].map { |r| r[:year] }
      expect(years).to eq(%w[2026 2025])
      expect(present[:roles_by_season].first).to include(year: '2026', current: true)
    end

    it 'excludes seasons where the user held a non-member role' do
      create(:seasons_user, user: user, season: prior_season, role: 'staff')

      expect(present[:roles_by_season].map { |r| r[:year] }).to eq(['2026'])
    end
  end

  it 'keeps the calendar fundraiser as its own figure, never folded into dues' do
    schedule = create(:payment_schedule, season: season, user: user)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 1.day, amount: 30_000)
    fundraiser = Calendar::Fundraiser.create!(user: user, season: season)
    Calendar::Donation.create!(fundraiser: fundraiser, user: user, amount: 5000, donation_date: 10)

    result = present
    expect(result[:fundraiser][:raised_cents]).to eq(5000)
    expect(result[:dues][:total]).to eq(30_000) # unchanged by the fundraiser
  end

  it 'includes deleted payments in the payment rows, flagged' do
    live = create(:payment, user: user, season: season, amount: 10_000, date_paid: Date.current - 2.days)
    gone = create(:payment, user: user, season: season, amount: 5000, date_paid: Date.current - 1.day)
    gone.destroy

    rows = present[:payment_rows]
    expect(rows.map { |r| r[:id] }).to contain_exactly(live.id, gone.id)
    expect(rows.find { |r| r[:id] == gone.id }[:deleted]).to be(true)
  end

  it 'marks schedule entries covered by the running payment total' do
    schedule = create(:payment_schedule, season: season, user: user)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 10, 17), amount: 10_000)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.new(2025, 11, 14), amount: 10_000)
    create(:payment, user: user, season: season, amount: 12_000, date_paid: Date.new(2025, 10, 18))

    entries = present[:schedule][:entries]
    expect(entries.map { |e| e[:covered] }).to eq([true, false])
  end
end
