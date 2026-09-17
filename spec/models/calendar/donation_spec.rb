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
  end
end
