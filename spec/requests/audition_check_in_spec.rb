# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Audition check-in sync', type: :request do
  include ActiveJob::TestHelper

  let(:report) do
    AuditionCheckIn::Sync::Report.new(written: { 'SNARE' => 2, 'MALLETS' => 1 }, matched: 2, unmatched: 1,
                                      duplicates: 0, unknown_instruments: { 'Triangle' => 1 },
                                      photos: 2, missing_photos: 1)
  end

  before { allow(AuditionCheckIn::Sync).to receive(:call) }

  context 'when switched off, as it is outside the audition season' do
    around do |example|
      original = ENV.delete('AUDITION_CHECK_IN_ENABLED')
      example.run
    ensure
      ENV['AUDITION_CHECK_IN_ENABLED'] = original if original
    end

    it 'shows the button disabled and offers no way to confirm' do
      get '/auditions-check-in'

      expect(response.body).to include('Turned off until next season')
      expect(response.body).not_to include('Yes, overwrite the sheet and docs')
    end

    it 'refuses a sync posted directly, so the page is not the only guard' do
      expect { post '/auditions-check-in' }.not_to change(AuditionCheckInRun, :count)
      expect(enqueued_jobs).to be_empty
    end
  end

  context 'when switched on' do
    before { allow(AuditionCheckIn::Sync).to receive(:enabled?).and_return(true) }

    it 'only asks for confirmation on page load, never syncs' do
      get '/auditions-check-in'

      expect(enqueued_jobs).to be_empty
      expect(response.body).to include('Are you sure?', 'Yes, overwrite the sheet and docs')
    end

    it 'starts the sync in the background and comes straight back, so the request cannot time out' do
      post '/auditions-check-in'

      expect(response).to redirect_to('/auditions-check-in')
      expect(AuditionCheckInJob).to have_been_enqueued.with(AuditionCheckInRun.latest.id)
      expect(AuditionCheckIn::Sync).not_to have_received(:call)

      follow_redirect!
      expect(response.body).to include('Running…', 'window.location.reload()')
      expect(response.body).not_to include('Yes, overwrite the sheet and docs')
    end

    it 'will not start a second run while one is going' do
      AuditionCheckInRun.create!(status: 'running')

      expect { post '/auditions-check-in' }.not_to change(AuditionCheckInRun, :count)
      expect(enqueued_jobs).to be_empty
    end

    it 'shows the last run’s results once the job has finished' do
      AuditionCheckInRun.create!(status: 'succeeded', report: report.to_h, finished_at: 2.minutes.ago)

      get '/auditions-check-in'

      expect(response.body).to include('3 people on the feedback sheet and docs', '2 selfies in the docs',
                                       'Triangle (1)', 'Finished 2 minutes ago')
    end

    it 'shows why the last run failed' do
      AuditionCheckInRun.create!(status: 'failed', error: "The AUX tab doesn't match", finished_at: Time.current)

      get '/auditions-check-in'

      expect(response.body).to include("That didn't work", 'The AUX tab doesn&#39;t match')
    end
  end
end
