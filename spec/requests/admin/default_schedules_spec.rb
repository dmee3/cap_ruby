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

  it 'turns away a coordinator' do
    sign_in_as_coordinator(season: season)

    get '/admin/season/default-schedules'

    expect(response).to have_http_status(:redirect)
  end
end
