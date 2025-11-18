# frozen_string_literal: true

# == Schema Information
#
# Table name: calendar_fundraisers
#
#  id         :integer          not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  season_id  :integer
#  user_id    :integer
#
# Indexes
#
#  index_calendar_fundraisers_on_season_id  (season_id)
#  index_calendar_fundraisers_on_user_id    (user_id)
#
# Foreign Keys
#
#  season_id  (season_id => seasons.id)
#  user_id    (user_id => users.id)
#
require 'rails_helper'

RSpec.describe Calendar::Fundraiser, type: :model do
  let(:season) { create(:season) }
  let(:user) { create(:user) }

  describe 'associations' do
    let(:fundraiser) { Calendar::Fundraiser.create(user: user, season: season) }

    it 'belongs to user and season' do
      expect(fundraiser.user).to eq(user)
      expect(fundraiser.season).to eq(season)
    end

    it 'has many donations' do
      donation = Calendar::Donation.create(
        user: user,
        fundraiser: fundraiser,
        amount: 5000,
        donation_date: 10
      )
      expect(fundraiser.donations).to include(donation)
    end
  end

  describe 'completion tracking' do
    let(:fundraiser) { Calendar::Fundraiser.create(user: user, season: season) }

    it 'is incomplete when no donations' do
      expect(fundraiser.completed?).to be false
      expect(fundraiser.total_donations).to eq(0)
    end

    it 'tracks total donation dates' do
      Calendar::Donation.create(fundraiser: fundraiser, user: user, amount: 5000, donation_date: 10)
      Calendar::Donation.create(fundraiser: fundraiser, user: user, amount: 5000, donation_date: 5)

      expect(fundraiser.total_donations).to eq(15)
    end

    it 'is complete when total donations equals 496' do
      Calendar::Donation.create(fundraiser: fundraiser, user: user, amount: 50_000, donation_date: 496)
      expect(fundraiser.completed?).to be true
    end

    it 'is incomplete when total donations less than 496' do
      Calendar::Donation.create(fundraiser: fundraiser, user: user, amount: 5000, donation_date: 100)
      expect(fundraiser.completed?).to be false
    end
  end

  describe '.find_or_create_incomplete_for_user' do
    before do
      # Ensure a season exists since the method uses Season.last
      create(:season, year: '2026') unless Season.last
    end

    it 'creates new fundraiser if none exists' do
      expect do
        Calendar::Fundraiser.find_or_create_incomplete_for_user(user.id)
      end.to change(Calendar::Fundraiser, :count).by(1)
    end

    it 'returns existing incomplete fundraiser' do
      existing = Calendar::Fundraiser.create(user: user, season: Season.last)
      result = Calendar::Fundraiser.find_or_create_incomplete_for_user(user.id)
      expect(result).to eq(existing)
    end

    it 'creates new fundraiser if existing is complete' do
      complete = Calendar::Fundraiser.create(user: user, season: Season.last)
      Calendar::Donation.create(fundraiser: complete, user: user, amount: 50_000, donation_date: 496)

      result = Calendar::Fundraiser.find_or_create_incomplete_for_user(user.id)
      expect(result).not_to eq(complete)
      expect(result.completed?).to be false
    end
  end
end
