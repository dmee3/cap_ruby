# frozen_string_literal: true

require 'rails_helper'

# Public (unauthenticated) routes inherit from ApplicationController but must
# not render the app shell — its partials assume `current_user`. Regression
# guard for the Rollbar crash "undefined method `seasons' for nil:NilClass"
# after PR1 phase D collapsed the layouts.
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
end
