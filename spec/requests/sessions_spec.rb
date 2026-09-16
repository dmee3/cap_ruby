# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sessions', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:user) { create(:user) }

  before { create(:seasons_user, user: user, season: season, role: 'member') }

  describe 'GET /login' do
    it 'offers recovery as a strip rather than a link in a row' do
      get '/login'

      expect(response.body).to include('auth-footer-strip')
      expect(response.body).to include('Email me a reset link')
    end

    it 'leaves out the routes this app does not have' do
      get '/login'

      expect(response.body).not_to include('Sign up')
      expect(response.body).not_to include('confirmation instructions')
    end
  end

  describe 'POST /login with the wrong password' do
    it 'says so and accents the way out' do
      post '/login', params: { user: { email: user.email, password: 'wrong-password' } }
      follow_redirect! while response.redirect?

      expect(response.body).to include('Invalid Email or password')
      expect(response.body).to include('auth-footer-strip--accented')
    end
  end

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

    # Guards the redirect change against ever skipping the actual sign-out.
    it 'still destroys the session' do
      get '/members'

      expect(response).to redirect_to('/login')
    end
  end
end
