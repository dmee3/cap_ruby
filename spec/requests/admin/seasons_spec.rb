# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin season settings', type: :request do
  let(:season) do
    create(:season, year: Date.today.year, conflict_submission_open: false, calendar_fundraiser_enabled: false)
  end

  describe 'Admin access' do
    before { sign_in_as_admin(season: season) }

    it 'can view the season edit page' do
      get '/admin/season/edit'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Members can submit conflicts')
      expect(response.body).to include('Calendar fundraiser is open')
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

    it 'can open the calendar fundraiser for the season' do
      patch '/admin/season', params: { season: { calendar_fundraiser_enabled: true } }

      expect(response).to redirect_to(edit_admin_season_path)
      expect(season.reload.calendar_fundraiser_enabled).to be(true)
    end

    it 'can close the calendar fundraiser for the season' do
      season.update!(calendar_fundraiser_enabled: true)

      patch '/admin/season', params: { season: { calendar_fundraiser_enabled: false } }

      expect(season.reload.calendar_fundraiser_enabled).to be(false)
    end
  end
end
