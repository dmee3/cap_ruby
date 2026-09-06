# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ConflictPresenter do
  let(:season) { create(:season, year: Date.today.year) }
  let(:user) { create(:user) }
  let(:pending) { create(:conflict_status, name: 'Pending') }
  let(:approved) { create(:conflict_status, name: 'Approved') }
  let(:denied) { create(:conflict_status, name: 'Denied') }

  def conflict(start_at:, end_at:, status: pending, reason: 'Something came up', skip_future: false)
    c = Conflict.new(user: user, season: season, conflict_status: status,
                     start_date: start_at, end_date: end_at, reason: reason)
    c.skip_future_date_validation = skip_future
    c.save!
    c
  end

  describe '.rows_for' do
    it 'formats a same-day timed conflict as "Weekday M/D" + a time range' do
      start_at = 5.days.from_now.change(hour: 18, min: 30)
      row = described_class.rows_for([conflict(start_at: start_at, end_at: start_at + 3.hours)]).first

      expect(row[:date_range_label]).to eq(start_at.strftime('%a %-m/%-d'))
      expect(row[:time_range_label]).to eq('6:30 PM–9:30 PM')
    end

    it 'labels a full-day conflict "all day"' do
      day = 5.days.from_now.to_date
      all_day = conflict(start_at: day.in_time_zone.beginning_of_day, end_at: day.in_time_zone.end_of_day)
      row = described_class.rows_for([all_day]).first

      expect(row[:time_range_label]).to eq('all day')
    end

    it 'drops the weekday for a conflict more than 14 days out' do
      start_at = 30.days.from_now.change(hour: 18, min: 30)
      row = described_class.rows_for([conflict(start_at: start_at, end_at: start_at + 1.hour)]).first

      expect(row[:date_range_label]).to eq(start_at.strftime('%-m/%-d/%y'))
    end

    it 'formats a multi-day conflict as a date range, no time' do
      start_at = 5.days.from_now.change(hour: 18)
      row = described_class.rows_for([conflict(start_at: start_at, end_at: start_at + 2.days)]).first

      expect(row[:date_range_label]).to eq(
        "#{start_at.strftime('%a %-m/%-d')} – #{(start_at + 2.days).strftime('%-m/%-d')}"
      )
      expect(row).not_to have_key(:time_range_label)
    end

    it 'includes the reason only for Denied rows and the next upcoming Pending row' do
      next_up = conflict(start_at: 3.days.from_now, end_at: 3.days.from_now + 1.hour, reason: 'Next one')
      later = conflict(start_at: 10.days.from_now, end_at: 10.days.from_now + 1.hour, reason: 'Later one')
      denied_c = conflict(start_at: 5.days.from_now, end_at: 5.days.from_now + 1.hour,
                          status: denied, reason: 'Denied one')
      approved_c = conflict(start_at: 6.days.from_now, end_at: 6.days.from_now + 1.hour,
                            status: approved, reason: 'Approved one')

      rows = described_class.rows_for([next_up, later, denied_c, approved_c]).index_by { |r| r[:id] }

      expect(rows[next_up.id][:reason]).to eq('Next one')
      expect(rows[denied_c.id][:reason]).to eq('Denied one')
      expect(rows[later.id]).not_to have_key(:reason)
      expect(rows[approved_c.id]).not_to have_key(:reason)
    end

    it 'gives a past conflict a submitted-only subline, a future one a "in N days" prefix' do
      past = conflict(start_at: 3.days.ago, end_at: 3.days.ago + 1.hour, skip_future: true)
      future = conflict(start_at: 4.days.from_now, end_at: 4.days.from_now + 1.hour)

      rows = described_class.rows_for([past, future]).index_by { |r| r[:id] }

      expect(rows[past.id][:relative_subline]).to match(/\Asubmitted .* ago\z/)
      expect(rows[future.id][:relative_subline]).to match(/\Ain 4 days · submitted/)
    end
  end
end
