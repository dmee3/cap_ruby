# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::Files', type: :request do
  let(:season) { create(:season, year: '2026') }

  describe 'GET /api/files' do
    context 'when unauthenticated' do
      it 'redirects to login' do
        get '/api/files'
        expect(response).to redirect_to(new_user_session_path)
      end
    end

    context 'when authenticated' do
      let(:user) { create(:user) }

      before do
        create(:seasons_user, user: user, season: season, role: 'member')
        sign_in user
        cookies[:cap_season_id] = season.id
        allow(External::GoogleDriveApi).to receive(:get_files).and_return([])
      end

      it 'returns files for current season' do
        get '/api/files'
        expect(response).to have_http_status(:success)
        expect(External::GoogleDriveApi).to have_received(:get_files).with('2026', '')
      end

      it 'returns JSON response' do
        get '/api/files'
        expect(response.content_type).to include('application/json')
      end

      # A season nobody has connected a folder for used to raise KeyError out of
      # ENV.fetch, so the screen got a 500 where it wanted a sentence.
      it 'answers a season with no configured folder with a 404, not a crash' do
        allow(External::GoogleDriveApi).to receive(:get_files)
          .and_raise(External::GoogleDriveApi::UnconfiguredSeason, 'no folder')

        get '/api/files'

        expect(response).to have_http_status(:not_found)
        expect(response.parsed_body['error']).to eq('unconfigured_season')
      end

      it 'answers a Drive outage with a 502 the screen can retry' do
        allow(External::GoogleDriveApi).to receive(:get_files).and_raise(StandardError, 'boom')
        allow(Rollbar).to receive(:error)

        get '/api/files'

        expect(response).to have_http_status(:bad_gateway)
        expect(response.parsed_body['error']).to eq('drive_unavailable')
      end
    end
  end

  describe 'GET /api/files/:id' do
    let(:user) { create(:user) }

    before do
      create(:seasons_user, user: user, season: season, role: 'member')
      sign_in user
      cookies[:cap_season_id] = season.id
      allow(External::GoogleDriveApi).to receive(:get_files).and_return([])
    end

    it 'fetches specific folder files' do
      get '/api/files/folder123'
      expect(response).to have_http_status(:success)
      expect(External::GoogleDriveApi).to have_received(:get_files).with('2026', 'folder123')
    end
  end
end
