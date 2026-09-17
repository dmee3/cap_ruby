# frozen_string_literal: true

require 'rails_helper'

RSpec.describe StaffConflictPresenter do
  let(:season) { create(:season, year: Date.today.year) }
  let(:pending) { create(:conflict_status, name: 'Pending') }
  let(:approved) { create(:conflict_status, name: 'Approved') }

  def member(first_name:, last_name:, section: 'Snare')
    user = create(:user, first_name: first_name, last_name: last_name)
    create(:seasons_user, user: user, season: season, section: section, role: 'member')
    user
  end

  def conflict(user:, start_at:, end_at: nil, status: pending, reason: 'Something came up')
    create(:conflict, user: user, season: season, conflict_status: status,
                      start_date: start_at, end_date: end_at || (start_at + 3.hours), reason: reason)
  end

  describe '.date_groups_for' do
    it 'groups conflicts by the date they fall on, soonest first' do
      marcus = member(first_name: 'Marcus', last_name: 'Webb')
      elena = member(first_name: 'Elena', last_name: 'Sokol')
      conflict(user: elena, start_at: 5.days.from_now.change(hour: 9))
      conflict(user: marcus, start_at: 3.days.from_now.change(hour: 18))

      groups = described_class.date_groups_for(Conflict.all, season.id)

      expect(groups.map { |g| g[:date] }).to eq(
        [3.days.from_now.to_date.iso8601, 5.days.from_now.to_date.iso8601]
      )
      expect(groups.first[:rows].map { |r| r[:member] }).to eq(['Marcus Webb'])
    end

    it 'counts how many are out on each date' do
      day = 4.days.from_now.change(hour: 18)
      conflict(user: member(first_name: 'Marcus', last_name: 'Webb'), start_at: day)
      conflict(user: member(first_name: 'Elena', last_name: 'Sokol'), start_at: day + 1.hour)
      conflict(user: member(first_name: 'Wes', last_name: 'Hardin'), start_at: 9.days.from_now)

      groups = described_class.date_groups_for(Conflict.all, season.id)

      expect(groups.map { |g| g[:out_count] }).to eq([2, 1])
    end

    it 'names the member and their section on every row' do
      wes = member(first_name: 'Wes', last_name: 'Hardin', section: 'Bass 3')
      conflict(user: wes, start_at: 6.days.from_now.change(hour: 14))

      row = described_class.date_groups_for(Conflict.all, season.id).first[:rows].first

      expect(row[:member]).to eq('Wes Hardin')
      expect(row[:section]).to eq('Bass 3')
      expect(row[:initials]).to eq('WH')
    end

    it 'carries the status so the row can show where a decision landed' do
      elena = member(first_name: 'Elena', last_name: 'Sokol')
      conflict(user: elena, start_at: 5.days.from_now.change(hour: 9), status: approved)

      row = described_class.date_groups_for(Conflict.all, season.id).first[:rows].first

      expect(row[:status]).to eq('Approved')
    end

    it 'keeps the §4.19 date and time labels the member list uses' do
      marcus = member(first_name: 'Marcus', last_name: 'Webb')
      start_at = 4.days.from_now.change(hour: 18, min: 30)
      conflict(user: marcus, start_at: start_at, end_at: start_at + 3.hours)

      row = described_class.date_groups_for(Conflict.all, season.id).first[:rows].first

      expect(row[:date_range_label]).to eq(start_at.strftime('%a %-m/%-d'))
      expect(row[:time_range_label]).to eq('6:30 PM–9:30 PM')
    end

    it 'withholds the reason, so a read-only row offers nothing to expand' do
      marcus = member(first_name: 'Marcus', last_name: 'Webb')
      conflict(user: marcus, start_at: 3.days.from_now, reason: 'Family wedding out of state')

      row = described_class.date_groups_for(Conflict.all, season.id).first[:rows].first

      expect(row).not_to have_key(:reason)
    end

    it 'offers no edit affordance, since staff cannot change a conflict' do
      marcus = member(first_name: 'Marcus', last_name: 'Webb')
      conflict(user: marcus, start_at: 3.days.from_now)

      row = described_class.date_groups_for(Conflict.all, season.id).first[:rows].first

      expect(row).not_to have_key(:edit_path)
      expect(row).not_to have_key(:editable)
    end

    it 'leaves the subline free of who decided it' do
      elena = member(first_name: 'Elena', last_name: 'Sokol')
      conflict(user: elena, start_at: 5.days.from_now, status: approved)
      create(:activity, activity_type: 'conflict', user: elena,
                        description: 'Conflict marked approved')

      row = described_class.date_groups_for(Conflict.all, season.id).first[:rows].first

      expect(row[:relative_subline]).not_to include('approved it')
    end

    it 'returns no groups when nobody is out' do
      expect(described_class.date_groups_for(Conflict.none, season.id)).to eq([])
    end
  end
end
