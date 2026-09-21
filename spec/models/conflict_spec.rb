# frozen_string_literal: true

# == Schema Information
#
# Table name: conflicts
#
#  id         :integer          not null, primary key
#  deleted_at :datetime
#  end_date   :datetime
#  reason     :text
#  start_date :datetime
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  season_id  :integer
#  status_id  :integer
#  user_id    :integer
#
# Indexes
#
#  index_conflicts_on_season_id  (season_id)
#  index_conflicts_on_status_id  (status_id)
#  index_conflicts_on_user_id    (user_id)
#
require 'rails_helper'

RSpec.describe Conflict, type: :model do
  context 'validations' do
    subject { create(:conflict) }

    it 'requires an end date' do
      subject.end_date = nil
      expect(subject).to_not be_valid
    end

    it 'requires a reason' do
      subject.reason = nil
      expect(subject).to_not be_valid
    end

    it 'requires a non-empty reason' do
      subject.reason = ''
      expect(subject).to_not be_valid
    end

    it 'requires a season' do
      subject.season_id = nil
      expect(subject).to_not be_valid
    end

    it 'requires a start date' do
      subject.start_date = nil
      expect(subject).to_not be_valid
    end

    it 'requires a status' do
      subject.status_id = nil
      expect(subject).to_not be_valid
    end

    it 'requires a user' do
      subject.user_id = nil
      expect(subject).to_not be_valid
    end

    context 'date validation for member submissions' do
      let(:user) { create(:user) }
      let(:season) { create(:season) }
      let(:status) { create(:conflict_status) }

      it 'rejects past start dates on create' do
        conflict = Conflict.new(
          user: user,
          season: season,
          conflict_status: status,
          start_date: 1.day.ago,
          end_date: 1.day.from_now,
          reason: 'Test reason'
        )
        expect(conflict).to_not be_valid
        expect(conflict.errors[:start_date]).to include('must be in the future')
      end

      it 'rejects past end dates on create' do
        conflict = Conflict.new(
          user: user,
          season: season,
          conflict_status: status,
          start_date: 1.day.from_now,
          end_date: 1.hour.ago,
          reason: 'Test reason'
        )
        expect(conflict).to_not be_valid
        expect(conflict.errors[:end_date]).to include('must be in the future')
      end

      it 'allows future dates on create' do
        conflict = Conflict.new(
          user: user,
          season: season,
          conflict_status: status,
          start_date: 1.day.from_now,
          end_date: 2.days.from_now,
          reason: 'Test reason'
        )
        expect(conflict).to be_valid
      end

      it 'allows past dates when skip_future_date_validation is set' do
        conflict = Conflict.new(
          user: user,
          season: season,
          conflict_status: status,
          start_date: 1.week.ago,
          end_date: 1.day.ago,
          reason: 'Test reason'
        )
        conflict.skip_future_date_validation = true
        expect(conflict).to be_valid
      end
    end

    context 'date order validation' do
      let(:user) { create(:user) }
      let(:season) { create(:season) }
      let(:status) { create(:conflict_status) }

      it 'rejects an end date before the start date' do
        conflict = Conflict.new(
          user: user,
          season: season,
          conflict_status: status,
          start_date: 2.days.from_now,
          end_date: 1.day.from_now,
          reason: 'Test reason'
        )
        expect(conflict).to_not be_valid
        expect(conflict.errors[:end_date]).to include('must be on or after the start date')
      end

      it 'allows an end date equal to the start date' do
        same_time = 1.day.from_now
        conflict = Conflict.new(
          user: user,
          season: season,
          conflict_status: status,
          start_date: same_time,
          end_date: same_time,
          reason: 'Test reason'
        )
        expect(conflict).to be_valid
      end

      it 'rejects an end date before the start date even when skipping future date validation' do
        conflict = Conflict.new(
          user: user,
          season: season,
          conflict_status: status,
          start_date: 2.days.ago,
          end_date: 3.days.ago,
          reason: 'Test reason'
        )
        conflict.skip_future_date_validation = true
        expect(conflict).to_not be_valid
        expect(conflict.errors[:end_date]).to include('must be on or after the start date')
      end
    end
  end

  context 'scopes' do
    let(:season) { create(:season, year: '2019') }
    let(:last_season) { create(:season, year: '2018') }
    let(:denied_status) { create(:conflict_status, name: 'Denied') }
    let!(:current_conflict) do
      create(:conflict, season: season)
    end
    let!(:old_conflict) do
      create(
        :conflict,
        start_date: DateTime.yesterday - 1.year - 1.day,
        end_date: DateTime.yesterday - 1.year,
        conflict_status: denied_status,
        season: last_season,
        skip_future_date_validation: true
      )
    end

    context 'for_season' do
      it 'returns conflicts for the given season' do
        expect(described_class.for_season(season.id)).to eq([current_conflict])
      end
    end

    context 'future_conflicts' do
      def conflict_ending_at(end_date)
        create(
          :conflict,
          start_date: end_date - 1.hour,
          end_date: end_date,
          season: season,
          skip_future_date_validation: true
        )
      end

      it 'returns future conflicts' do
        expect(described_class.future_conflicts).to eq([current_conflict])
      end

      it 'excludes a conflict that ended yesterday afternoon' do
        ended = conflict_ending_at(Date.yesterday.beginning_of_day + 14.hours)

        expect(described_class.future_conflicts).to_not include(ended)
      end

      it 'includes a conflict still running later today' do
        running = conflict_ending_at(Date.current.beginning_of_day + 23.hours)

        expect(described_class.future_conflicts).to include(running)
      end

      it 'includes a conflict ending exactly at the start of today' do
        boundary = conflict_ending_at(Date.current.beginning_of_day)

        expect(described_class.future_conflicts).to include(boundary)
      end

      it 'splits every conflict between future_conflicts and past_conflicts' do
        conflict_ending_at(Date.yesterday.beginning_of_day + 14.hours)
        conflict_ending_at(Date.current.beginning_of_day)
        conflict_ending_at(Date.current.beginning_of_day + 23.hours)

        future = described_class.future_conflicts.ids
        past = described_class.past_conflicts.ids

        expect(future & past).to be_empty
        expect((future + past).sort).to eq(described_class.all.ids.sort)
      end
    end

    context 'past_conflicts' do
      it 'returns past conflicts' do
        expect(described_class.past_conflicts).to eq([old_conflict])
      end
    end

    context 'with_status' do
      it 'returns conflicts with the given status' do
        expect(described_class.with_status(denied_status.id)).to eq([old_conflict])
      end
    end

    context 'without_status' do
      it 'returns conflicts without the given status' do
        expect(described_class.without_status(denied_status.id)).to eq([current_conflict])
      end
    end
  end
end
