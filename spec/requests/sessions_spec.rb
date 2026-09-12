# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sessions', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:user) { create(:user) }

  before { create(:seasons_user, user: user, season: season, role: 'member') }

  describe 'DELETE /logout' do
    before do
      sign_in user
      cookies[:cap_season_id] = season.id
      delete '/logout'
    end

    it 'goes straight to the login page instead of bouncing off root' do
      expect(response).to redirect_to('/login')
    end

    it 'does not scold the user for signing out' do
      follow_redirect! while response.redirect?

      expect(flash[:alert]).to be_blank
      expect(response.body).not_to include('You need to sign in or sign up before continuing.')
    end

    # The whole point of the redirect change is that it moves only the landing
    # page. If it ever started leaving the session intact, this fails loudly.
    it 'still destroys the session' do
      get '/members'

      expect(response).to redirect_to('/login')
    end
  end
end
