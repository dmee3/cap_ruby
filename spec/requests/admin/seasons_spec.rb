# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin season settings', type: :request do
  let(:season) { create(:season, year: Date.today.year, conflict_submission_open: false) }

  describe 'Admin access' do
    before { sign_in_as_admin(season: season) }

    it 'can view the season edit page' do
      get '/admin/season/edit'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Conflict submission')
    end

    it "links an unset season's defaults card straight to setup" do
      get '/admin/season/edit'

      expect(response.body).to include("No #{season.year} defaults yet")
      expect(response.body).to include('href="/admin/season/default-schedules"')
    end

    it 'can open conflict submission for the season' do
      patch '/admin/season', params: { season: { conflict_submission_open: true } }

      expect(response).to redirect_to(edit_admin_season_path)
      expect(season.reload.conflict_submission_open).to be(true)
    end

    it 'can close conflict submission for the season' do
      season.update!(conflict_submission_open: true)

      patch '/admin/season', params: { season: { conflict_submission_open: false } }

      expect(response).to redirect_to(edit_admin_season_path)
      expect(season.reload.conflict_submission_open).to be(false)
    end
  end
end
