# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AuditionCheckInJob do
  let(:run) { AuditionCheckInRun.create! }
  let(:report) do
    AuditionCheckIn::Sync::Report.new(written: { 'SNARE' => 2 }, matched: 2, unmatched: 0, duplicates: 0,
                                      unknown_instruments: {}, photos: 2, missing_photos: 0)
  end

  it 'records the report so the page can show it once the job is done' do
    allow(AuditionCheckIn::Sync).to receive(:call).and_return(report)

    described_class.perform_now(run.id)

    run.reload
    expect(run.status).to eq('succeeded')
    expect(run.sync_report.to_h).to eq(report.to_h)
    expect([run.started_at, run.finished_at]).to all(be_present)
  end

  it "records a problem with the sheets in the sync's own words" do
    allow(AuditionCheckIn::Sync).to receive(:call).and_raise(AuditionCheckIn::Error, "The AUX tab doesn't match")

    described_class.perform_now(run.id)

    expect(run.reload.error_message).to eq("The AUX tab doesn't match")
  end

  it 'swallows an unexpected error rather than raising it, so Sidekiq never retries an overwrite' do
    allow(AuditionCheckIn::Sync).to receive(:call).and_raise(Faraday::TimeoutError, 'backend timed out')
    allow(Rollbar).to receive(:error)

    expect { described_class.perform_now(run.id) }.not_to raise_error
    expect(run.reload.status).to eq('failed')
    expect(Rollbar).to have_received(:error)
  end
end
