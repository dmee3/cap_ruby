# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SeasonsUser, type: :model do
  describe 'associations' do
    let(:season) { create(:season) }
    let(:user) { create(:user) }
    let(:seasons_user) { create(:seasons_user, season: season, user: user) }

    it 'belongs to a season' do
      expect(seasons_user.season).to eq(season)
    end

    it 'belongs to a user' do
      expect(seasons_user.user).to eq(user)
    end
  end

  describe 'role assignment' do
    let(:season) { create(:season, year: '2026') }
    let(:user) { create(:user) }

    it 'creates a member role' do
      seasons_user = create(:seasons_user, season: season, user: user, role: 'member')
      expect(seasons_user.role).to eq('member')
    end

    it 'creates a staff role' do
      seasons_user = create(:seasons_user, season: season, user: user, role: 'staff')
      expect(seasons_user.role).to eq('staff')
    end

    it 'creates a coordinator role' do
      seasons_user = create(:seasons_user, season: season, user: user, role: 'coordinator')
      expect(seasons_user.role).to eq('coordinator')
    end

    it 'creates an admin role' do
      seasons_user = create(:seasons_user, season: season, user: user, role: 'admin')
      expect(seasons_user.role).to eq('admin')
    end
  end

  describe 'ensemble and section assignment' do
    let(:season) { create(:season, year: '2026') }
    let(:user) { create(:user) }

    it 'assigns ensemble and section' do
      seasons_user = create(:seasons_user,
                            season: season,
                            user: user,
                            ensemble: 'World',
                            section: 'Snare')
      expect(seasons_user.ensemble).to eq('World')
      expect(seasons_user.section).to eq('Snare')
    end

    it 'supports different ensembles' do
      su1 = create(:seasons_user, season: season, user: user, ensemble: 'World')
      su2 = create(:seasons_user, season: season, user: create(:user), ensemble: 'CC2')

      expect([su1.ensemble, su2.ensemble]).to match_array(%w[World CC2])
    end

    it 'supports different sections' do
      sections = %w[Snare Tenors Woods Metals]
      seasons_users = sections.map do |section|
        create(:seasons_user, season: season, user: create(:user), section: section)
      end

      expect(seasons_users.map(&:section)).to match_array(sections)
    end
  end

  describe 'user can have different roles in different seasons' do
    let(:season_2025) { create(:season, year: '2025') }
    let(:season_2026) { create(:season, year: '2026') }
    let(:user) { create(:user) }

    it 'allows same user to have different roles across seasons' do
      su_2025 = create(:seasons_user, season: season_2025, user: user, role: 'member')
      su_2026 = create(:seasons_user, season: season_2026, user: user, role: 'coordinator')

      expect(su_2025.role).to eq('member')
      expect(su_2026.role).to eq('coordinator')
    end

    it 'allows same user to change ensemble across seasons' do
      su_2025 = create(:seasons_user, season: season_2025, user: user, ensemble: 'CC2')
      su_2026 = create(:seasons_user, season: season_2026, user: user, ensemble: 'World')

      expect(su_2025.ensemble).to eq('CC2')
      expect(su_2026.ensemble).to eq('World')
    end
  end
end
