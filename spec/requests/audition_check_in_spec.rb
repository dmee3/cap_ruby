# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Audition check-in sync', type: :request do
  let(:report) do
    AuditionCheckIn::Sync::Report.new(written: { 'SNARE' => 2, 'MALLETS' => 1 }, matched: 2, unmatched: 1,
                                      duplicates: 0, unknown_instruments: { 'Triangle' => 1 },
                                      photos: 2, missing_photos: 1)
  end

  before { allow(AuditionCheckIn::Sync).to receive(:call).and_return(report) }

  it 'only asks for confirmation on page load, never syncs' do
    get '/auditions-check-in'

    expect(AuditionCheckIn::Sync).not_to have_received(:call)
    expect(response.body).to include('Are you sure?', 'Yes, overwrite the sheet and docs')
  end

  it 'syncs on confirm and shows the results after redirecting, so a refresh cannot re-run it' do
    post '/auditions-check-in'
    expect(response).to redirect_to('/auditions-check-in')

    follow_redirect!
    expect(AuditionCheckIn::Sync).to have_received(:call).once
    expect(response.body).to include('3 people on the feedback sheet and docs', '2 selfies in the docs', 'Triangle (1)')
  end

  it 'shows the reason when the sheets are not in the expected shape' do
    allow(AuditionCheckIn::Sync).to receive(:call).and_raise(AuditionCheckIn::Error, "The AUX tab doesn't match")

    post '/auditions-check-in'
    follow_redirect!

    expect(response.body).to include("That didn't work", 'The AUX tab doesn&#39;t match')
  end
end
