# frozen_string_literal: true

require 'rails_helper'

# The triage screens themselves (Flow 5). Both roles render the same widget
# from the same entrypoint; only the base path differs.
RSpec.describe 'Conflict triage screens', type: :request do
  let(:season) { create(:season, year: Date.today.year) }

  before do
    allow(ActivityLogger).to receive(:log_conflict)
    create(:conflict_status, name: 'Pending')
  end

  describe 'GET /admin/conflicts' do
    before { sign_in_as_admin(season: season) }

    it 'renders the shared triage mount with the admin base path' do
      get '/admin/conflicts'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('data-base-path="/admin/conflicts"')
      expect(response.body).to include('id="conflicts"')
    end

    it 'passes the season ensembles for the filter' do
      member = create(:user)
      create(:seasons_user, user: member, season: season, role: 'member', ensemble: 'Battery')

      get '/admin/conflicts'

      expect(response.body).to include('Battery')
    end
  end

  describe 'GET /coordinators/conflicts' do
    before { sign_in_as_coordinator(season: season) }

    it 'renders the same widget with the coordinator base path' do
      get '/coordinators/conflicts'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('data-base-path="/coordinators/conflicts"')
      expect(response.body).to include('id="conflicts"')
    end
  end

  # redirect_if_not is an exact role match, not a hierarchy: each role reaches
  # its own screen and is redirected away from the other's.
  it 'keeps a coordinator out of the admin screen' do
    sign_in_as_coordinator(season: season)

    get '/admin/conflicts'

    expect(response).to have_http_status(:found)
  end

  it 'keeps a member out of both' do
    sign_in_as_member(season: season)

    get '/admin/conflicts'
    expect(response).to have_http_status(:found)

    get '/coordinators/conflicts'
    expect(response).to have_http_status(:found)
  end
end
