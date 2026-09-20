# frozen_string_literal: true

require 'rails_helper'

# Access follows the roster: a season someone was removed from is gone from the
# app for them, while every season they are still on behaves as it always did.
RSpec.describe 'Season access after removal', type: :request do
  let(:past) { create(:season, year: '2025') }
  let(:current) { create(:season, year: '2026') }

  describe 'a member removed from the current season but not a past one' do
    let(:user) do
      create(:user).tap do |u|
        create(:seasons_user, user: u, season: past, role: 'member')
        create(:seasons_user, user: u, season: current, role: 'member')
      end
    end

    before do
      SeasonRemovalService.remove(user, current.id)
      sign_in user
    end

    it 'falls back to the season they are still on when the cookie points at the removed one' do
      cookies[:cap_season_id] = current.id

      get '/members'

      expect(cookies[:cap_season_id].to_s).to eq(past.id.to_s)
    end

    it 'refuses to switch to the removed season' do
      cookies[:cap_season_id] = past.id

      post '/change-season', params: { season_id: current.id }

      expect(cookies[:cap_season_id].to_s).to eq(past.id.to_s)
    end

    it 'still serves the season they are on' do
      cookies[:cap_season_id] = past.id

      get '/members'

      expect(response).to have_http_status(:ok)
    end

    it 'can still sign in' do
      expect(user.reload).to be_active_for_authentication
    end
  end

  describe 'a member whose only season was removed' do
    let(:user) do
      create(:user).tap { |u| create(:seasons_user, user: u, season: current, role: 'member') }
    end

    before { SeasonRemovalService.remove(user, current.id) }

    it 'cannot authenticate' do
      expect(user.reload).not_to be_active_for_authentication
    end

    it 'has no season left to land on' do
      expect(user.reload.active_seasons).to be_empty
    end

    # A session that outlived the removal is turned away at the door, without
    # raising on the way: Devise rejects the user before any controller runs,
    # and nothing downstream tries to name the season they no longer have.
    it 'turns away a session that outlived the removal' do
      sign_in user
      cookies[:cap_season_id] = current.id

      expect { get '/' }.not_to raise_error
      expect(response).to redirect_to('/login')
    end
  end
end
