# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin default payment schedules', type: :request do
  let(:season) { create(:season, year: '2027') }

  before { sign_in_as_admin(season: season) }

  it 'offers every other season with defaults as a copy source, newest first' do
    seed_default_schedules(create(:season, year: '2025'))
    seed_default_schedules(create(:season, year: '2026'))

    get '/admin/season/default-schedules/copy'

    data = JSON.parse(Nokogiri::HTML(response.body).at_css('#default-schedules-copy')['data-copy'])
    expect(data['sources'].map { |s| s['year'] }).to eq(%w[2026 2025])
    expect(data['sources'].first['combinations'].size).to eq(8)
  end
end
