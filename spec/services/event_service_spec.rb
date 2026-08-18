# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EventService do
  let(:season) { create(:season) }

  describe '.next_event' do
    it 'returns the soonest upcoming event for the season' do
      later = create(:event, season: season, start_date: Date.today + 3.weeks, end_date: Date.today + 3.weeks)
      sooner = create(:event, season: season, start_date: Date.today + 1.week, end_date: Date.today + 1.week)

      expect(described_class.next_event(season.id)).to eq(sooner)
      expect(described_class.next_event(season.id)).not_to eq(later)
    end

    it 'includes an event that is currently in progress' do
      ongoing = create(:event, season: season, start_date: Date.today - 1.day, end_date: Date.today + 1.day)

      expect(described_class.next_event(season.id)).to eq(ongoing)
    end

    it 'excludes events that have already ended' do
      create(:event, season: season, start_date: Date.today - 2.weeks, end_date: Date.today - 1.week)

      expect(described_class.next_event(season.id)).to be_nil
    end

    it 'excludes events from other seasons' do
      other_season = create(:season, year: (season.year.to_i + 1).to_s)
      create(:event, season: other_season, start_date: Date.today + 1.week, end_date: Date.today + 1.week)

      expect(described_class.next_event(season.id)).to be_nil
    end

    it 'returns nil when there are no events for the season' do
      expect(described_class.next_event(season.id)).to be_nil
    end
  end
end
