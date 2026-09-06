# frozen_string_literal: true

require 'rails_helper'

# Public (unauthenticated) routes inherit from PublicController, which sets the
# shell-free `public` layout. The shell partials assume `current_user` and must
# never render without one. Regression guard for the Rollbar crash
# "undefined method `seasons' for nil:NilClass" after the layouts were collapsed.
RSpec.describe 'Public pages', type: :request do
  shared_examples 'a shell-free public page' do |path|
    it "renders #{path} without the app shell for logged-out visitors" do
      get path

      expect(response).to have_http_status(:success)
      expect(response.body).not_to include('class="app-sidebar"')
      expect(response.body).not_to include('app-drawer')
    end
  end

  include_examples 'a shell-free public page', '/auditions-spreadsheet'
  include_examples 'a shell-free public page', '/rhythm-converter'
  include_examples 'a shell-free public page', '/tarp-grid-tool'

  it 'still renders public pages fine for a logged-in visitor' do
    user = create(:user)
    create(:seasons_user, user: user, season: create(:season, year: Date.today.year), role: 'admin')
    sign_in user

    get '/auditions-spreadsheet'

    expect(response).to have_http_status(:success)
    # PublicController wins regardless of who's signed in — no shell.
    expect(response.body).not_to include('class="app-sidebar"')
  end
end
