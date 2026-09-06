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

  context 'for a signed-in visitor' do
    before do
      user = create(:user)
      create(:seasons_user, user: user, season: create(:season, year: Date.today.year), role: 'admin')
      sign_in user
    end

    it 'still renders the shell-free public layout (PublicController wins)' do
      get '/auditions-spreadsheet'

      expect(response).to have_http_status(:success)
      expect(response.body).not_to include('class="app-sidebar"')
    end

    it 'offers a link back to the shell' do
      get '/auditions-spreadsheet'

      expect(response.body).to include('Back to Cap City')
      expect(response.body).to include("href=\"#{root_path}\"")
    end
  end

  it 'does not show the back-to-shell link to a logged-out visitor' do
    get '/auditions-spreadsheet'

    expect(response.body).not_to include('Back to Cap City')
  end

  it 'sends a logged-out visitor from the home page to login' do
    get '/'

    expect(response).to redirect_to(new_user_session_path)
  end
end
