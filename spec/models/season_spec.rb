# frozen_string_literal: true

# == Schema Information
#
# Table name: seasons
#
#  id         :integer          not null, primary key
#  year       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
require 'rails_helper'

RSpec.describe Season, type: :model do
  describe 'associations' do
    let(:season) { create(:season) }

    it 'has many conflicts' do
      expect(season).to respond_to(:conflicts)
      expect(season.conflicts).to be_an(ActiveRecord::Associations::CollectionProxy)
    end

    it 'has many payment_schedules' do
      expect(season).to respond_to(:payment_schedules)
      expect(season.payment_schedules).to be_an(ActiveRecord::Associations::CollectionProxy)
    end

    it 'has many payments' do
      expect(season).to respond_to(:payments)
      expect(season.payments).to be_an(ActiveRecord::Associations::CollectionProxy)
    end

    it 'has many seasons_users' do
      expect(season).to respond_to(:seasons_users)
      expect(season.seasons_users).to be_an(ActiveRecord::Associations::CollectionProxy)
    end

    it 'has many users through seasons_users' do
      expect(season).to respond_to(:users)
      user = create(:user)
      create(:seasons_user, season: season, user: user)
      expect(season.users).to include(user)
    end
  end

  describe 'creation' do
    it 'can be created with a year' do
      season = create(:season, year: '2026')
      expect(season).to be_persisted
      expect(season.year).to eq('2026')
    end

    it 'can be created for the current year' do
      current_year = Date.today.year
      season = create(:season, year: current_year.to_s)
      expect(season.year).to eq(current_year.to_s)
    end
  end

  describe 'managing users through seasons_users' do
    let(:season) { create(:season, year: '2026') }
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }

    it 'can have multiple users associated' do
      create(:seasons_user, season: season, user: user1, role: 'member')
      create(:seasons_user, season: season, user: user2, role: 'admin')

      expect(season.users).to include(user1, user2)
      expect(season.users.count).to eq(2)
    end

    it 'can have users with different roles' do
      create(:seasons_user, season: season, user: user1, role: 'member')
      create(:seasons_user, season: season, user: user2, role: 'coordinator')

      expect(season.seasons_users.map(&:role)).to match_array(%w[member coordinator])
    end

    it 'can have users in different ensembles and sections' do
      create(:seasons_user, season: season, user: user1, ensemble: 'World', section: 'Snare')
      create(:seasons_user, season: season, user: user2, ensemble: 'CC2', section: 'Tenors')

      expect(season.seasons_users.map(&:ensemble)).to match_array(%w[World CC2])
      expect(season.seasons_users.map(&:section)).to match_array(%w[Snare Tenors])
    end
  end

  describe 'managing related data' do
    let(:season) { create(:season, year: '2026') }
    let(:user) { create(:user) }

    before do
      create(:seasons_user, season: season, user: user, role: 'member')
    end

    it 'can have conflicts associated' do
      conflict = create(:conflict, season: season, user: user)
      expect(season.conflicts).to include(conflict)
    end

    it 'can have payment schedules associated' do
      payment_schedule = create(:payment_schedule, season: season, user: user)
      expect(season.payment_schedules).to include(payment_schedule)
    end

    it 'can have payments associated' do
      payment_type = create(:payment_type)
      payment = create(:payment, season: season, user: user, payment_type: payment_type)
      expect(season.payments).to include(payment)
    end
  end
end
