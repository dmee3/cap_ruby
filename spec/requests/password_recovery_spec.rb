# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Password recovery', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:user) { create(:user, email: 'elena@example.com') }

  before { create(:seasons_user, user: user, season: season, role: 'member') }

  describe 'GET /password/new' do
    it 'states how long a link lasts' do
      get '/password/new'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('expires after 24 hours')
    end
  end

  describe 'POST /password' do
    it 'sends the reset mail and lands on a confirmation screen' do
      expect do
        post '/password', params: { user: { email: user.email } }
      end.to change { ActionMailer::Base.deliveries.count }.by(1)

      expect(response).to redirect_to(sent_password_path)
      expect(ActionMailer::Base.deliveries.last.to).to eq([user.email])
    end

    it 'names the address it sent to without putting it in the URL' do
      post '/password', params: { user: { email: user.email } }
      follow_redirect!

      expect(response.body).to include('Check your email')
      expect(response.body).to include(user.email)
      expect(request.fullpath).not_to include(user.email)
    end

    it 'answers an unknown address exactly as it answers a known one' do
      expect do
        post '/password', params: { user: { email: 'nobody@example.com' } }
      end.not_to(change { ActionMailer::Base.deliveries.count })

      expect(response).to redirect_to(sent_password_path)
      follow_redirect!
      expect(response.body).to include('Check your email')
      expect(response.body).not_to include('not found')
    end
  end

  describe 'GET /password/sent' do
    it 'sends someone who arrives without a request back to the form' do
      get '/password/sent'

      expect(response).to redirect_to('/password/new')
    end
  end

  describe 'GET /password/edit' do
    it 'accepts a live token' do
      token = user.send_reset_password_instructions

      get "/password/edit?reset_password_token=#{token}"

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Set a new password')
    end

    it 'sends an expired token to the start-again screen' do
      token = user.send_reset_password_instructions
      user.update!(reset_password_sent_at: 25.hours.ago)

      get "/password/edit?reset_password_token=#{token}"

      expect(response).to redirect_to(expired_password_path)
    end
  end

  describe 'GET /password/expired' do
    it 'says the account is fine and offers a fresh link' do
      get '/password/expired'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Nothing is wrong with your account')
      expect(response.body).to include('Send a new link')
    end
  end

  describe 'PUT /password' do
    it 'sets the new password and signs the user in' do
      token = user.send_reset_password_instructions

      put '/password', params: {
        user: {
          reset_password_token: token,
          password: 'newpassword1',
          password_confirmation: 'newpassword1'
        }
      }

      expect(user.reload.valid_password?('newpassword1')).to be(true)

      get '/members'
      expect(response).not_to redirect_to('/login')
    end

    it 'states the real floor when the new password is too short' do
      token = user.send_reset_password_instructions

      put '/password', params: {
        user: {
          reset_password_token: token,
          password: 'short12',
          password_confirmation: 'short12'
        }
      }

      expect(response.body).to include('minimum is 8 characters')
    end
  end
end
