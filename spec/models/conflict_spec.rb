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

    it { is_expected.to be_valid }

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
      it 'returns future conflicts' do
        expect(described_class.future_conflicts).to eq([current_conflict])
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
