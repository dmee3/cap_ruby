# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin default payment schedules', type: :request do
  let(:season) { create(:season, year: '2027') }

  context 'as an admin' do
    before { sign_in_as_admin(season: season) }

    it "mounts the overview with the current season's defaults" do
      seed_default_schedules(season)

      get '/admin/season/default-schedules'

      expect(response).to have_http_status(:success)
      overview = JSON.parse(Nokogiri::HTML(response.body).at_css('#default-schedules-overview')['data-overview'])
      expect(overview['season']['year']).to eq('2027')
      expect(overview['set_up_count']).to eq(8)
    end
  end

  context 'copying' do
    before { sign_in_as_admin(season: season) }

    it 'offers every other season with defaults as a source, newest first' do
      seed_default_schedules(create(:season, year: '2025'))
      seed_default_schedules(create(:season, year: '2026'))

      get '/admin/season/default-schedules/copy'

      data = JSON.parse(Nokogiri::HTML(response.body).at_css('#default-schedules-copy')['data-copy'])
      expect(data['sources'].map { |s| s['year'] }).to eq(%w[2026 2025])
      expect(data['sources'].first['combinations'].size).to eq(8)
    end
  end

  context 'editing one default' do
    before { sign_in_as_admin(season: season) }

    it 'mounts the editor for the combination in the URL' do
      get '/admin/season/default-schedules/cc2-visual-rookie'

      data = JSON.parse(Nokogiri::HTML(response.body).at_css('#default-schedule-editor')['data-editor'])
      expect(data['slug']).to eq('cc2-visual-rookie')
    end

    it 'is not found for a combination that does not exist' do
      get '/admin/season/default-schedules/world-battery-vet'

      expect(response).to have_http_status(:not_found)
    end
  end

  it 'mounts the move-dates screen with the season overview' do
    sign_in_as_admin(season: season)
    seed_default_schedules(season)

    get '/admin/season/default-schedules/dates'

    data = JSON.parse(Nokogiri::HTML(response.body).at_css('#default-schedule-dates')['data-overview'])
    expect(data['dates'].size).to eq(6)
  end

  it 'turns away a coordinator' do
    sign_in_as_coordinator(season: season)

    get '/admin/season/default-schedules'

    expect(response).to have_http_status(:redirect)
  end
end
