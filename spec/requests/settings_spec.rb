# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Settings', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:user) { create(:user, email: 'original@example.com', username: 'original_user') }

  before do
    create(:seasons_user, user: user, season: season, role: 'member')
  end

  describe 'GET /settings' do
    %w[member staff coordinator admin].each do |role|
      it "allows #{role} to access settings" do
        user.seasons_users.first.update(role: role)
        sign_in user
        cookies[:cap_season_id] = season.id

        get '/settings'
        expect(response).to have_http_status(:success)
      end

      it "allows #{role} to update settings" do
        user.seasons_users.first.update(role: role)
        sign_in user
        cookies[:cap_season_id] = season.id

        post '/settings', params: {
          email: "#{role}@example.com",
          username: "#{role}_username"
        }

        expect(response).to redirect_to(root_url)
        user.reload
        expect(user.email).to eq("#{role}@example.com")
      end

      it "allows #{role} to change password" do
        user.update(password: 'password123')
        user.seasons_users.first.update(role: role)
        sign_in user
        cookies[:cap_season_id] = season.id

        post '/settings-password', params: {
          old_password: 'password123',
          new_password: 'newpassword456',
          new_password_confirmation: 'newpassword456'
        }

        expect(response).to redirect_to(root_url)
      end
    end
  end

  describe 'POST /settings' do
    before do
      sign_in user
      cookies[:cap_season_id] = season.id
    end

    context 'with valid parameters' do
      it 'updates email and username' do
        post '/settings', params: {
          email: 'newemail@example.com',
          username: 'new_username'
        }

        expect(response).to redirect_to(root_url)
        expect(flash[:success]).to include('settings have been updated')

        user.reload
        expect(user.email).to eq('newemail@example.com')
        expect(user.username).to eq('new_username')
      end
    end

    context 'with invalid parameters' do
      it 'shows errors for invalid email' do
        post '/settings', params: {
          email: 'not-an-email',
          username: 'valid_username'
        }

        expect(response).to have_http_status(:success)
        # Page re-renders on error instead of redirecting
        user.reload
        expect(user.email).to eq('original@example.com') # Unchanged
      end

      it 'shows errors for duplicate username' do
        create(:user, username: 'taken_username')

        post '/settings', params: {
          email: 'newemail@example.com',
          username: 'taken_username'
        }

        expect(response).to have_http_status(:success)
        user.reload
        expect(user.username).to eq('original_user') # Unchanged
      end

      it 'shows errors for duplicate email' do
        create(:user, email: 'taken@example.com')

        post '/settings', params: {
          email: 'taken@example.com',
          username: 'new_username'
        }

        expect(response).to have_http_status(:success)
        user.reload
        expect(user.email).to eq('original@example.com') # Unchanged
      end
    end
  end

  describe 'POST /settings-password' do
    let(:old_password) { 'old_password123' }
    let(:new_password) { 'new_password456' }

    before do
      user.update(password: old_password)
      sign_in user
      cookies[:cap_season_id] = season.id
    end

    context 'with valid password change' do
      it 'updates the password successfully' do
        post '/settings-password', params: {
          old_password: old_password,
          new_password: new_password,
          new_password_confirmation: new_password
        }

        expect(response).to redirect_to(root_url)
        expect(flash[:success]).to include('Password updated')

        # Verify user can sign in with new password
        user.reload
        expect(user.valid_password?(new_password)).to be true
        expect(user.valid_password?(old_password)).to be false
      end
    end

    context 'with incorrect old password' do
      it 'shows error and does not update password' do
        post '/settings-password', params: {
          old_password: 'wrong_password',
          new_password: new_password,
          new_password_confirmation: new_password
        }

        expect(response).to have_http_status(:success)
        expect(response.body).to include('Old password was incorrect')

        user.reload
        expect(user.valid_password?(old_password)).to be true
      end
    end

    context 'when password confirmation does not match' do
      it 'shows error and does not update password' do
        post '/settings-password', params: {
          old_password: old_password,
          new_password: new_password,
          new_password_confirmation: 'different_password'
        }

        expect(response).to have_http_status(:success)
        expect(response.body).to include('Password confirmation does not match')

        user.reload
        expect(user.valid_password?(old_password)).to be true
      end
    end

    context 'with invalid new password' do
      it 'shows validation errors' do
        post '/settings-password', params: {
          old_password: old_password,
          new_password: 'short',
          new_password_confirmation: 'short'
        }

        expect(response).to have_http_status(:success)
        # Password validation error is shown
        expect(response.body).to include('Password')

        user.reload
        expect(user.valid_password?(old_password)).to be true
      end
    end
  end
end
