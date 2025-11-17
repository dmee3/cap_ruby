# frozen_string_literal: true

# == Schema Information
#
# Table name: calendar_donations
#
#  id                     :integer          not null, primary key
#  amount                 :integer
#  donation_date          :integer
#  donor_name             :string
#  notes                  :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  calendar_fundraiser_id :integer
#  season_id              :integer
#  user_id                :integer
#
# Indexes
#
#  index_calendar_donations_on_calendar_fundraiser_id  (calendar_fundraiser_id)
#  index_calendar_donations_on_season_id               (season_id)
#  index_calendar_donations_on_user_id                 (user_id)
#
# Foreign Keys
#
#  calendar_fundraiser_id  (calendar_fundraiser_id => calendar_fundraisers.id)
#  season_id               (season_id => seasons.id)
#
require 'rails_helper'

RSpec.describe Calendar::Donation, type: :model do
  let(:season) { create(:season) }
  let(:user) { create(:user) }
  let(:fundraiser) { Calendar::Fundraiser.create(user: user, season: season) }

  describe 'validations' do
    it 'requires amount' do
      donation = Calendar::Donation.new(
        user: user,
        fundraiser: fundraiser,
        donation_date: 10,
        donor_name: 'Test Donor'
      )
      expect(donation).not_to be_valid
      expect(donation.errors[:amount]).to be_present
    end

    it 'creates valid donation with required fields' do
      donation = Calendar::Donation.create(
        user: user,
        fundraiser: fundraiser,
        amount: 5000,
        donation_date: 10,
        donor_name: 'Test Donor'
      )
      expect(donation).to be_valid
      expect(donation).to be_persisted
    end
  end

  describe 'associations' do
    let(:donation) do
      Calendar::Donation.create(
        user: user,
        fundraiser: fundraiser,
        amount: 5000,
        donation_date: 10
      )
    end

    it 'belongs to user' do
      expect(donation.user).to eq(user)
    end

    it 'belongs to fundraiser' do
      expect(donation.fundraiser).to eq(fundraiser)
    end
  end

  describe 'donation tracking' do
    it 'stores amount in cents' do
      donation = Calendar::Donation.create(
        user: user,
        fundraiser: fundraiser,
        amount: 5000,
        donation_date: 10
      )
      expect(donation.amount).to eq(5000)
    end

    it 'stores donation date as integer' do
      donation = Calendar::Donation.create(
        user: user,
        fundraiser: fundraiser,
        amount: 5000,
        donation_date: 25
      )
      expect(donation.donation_date).to eq(25)
    end
  end
end
