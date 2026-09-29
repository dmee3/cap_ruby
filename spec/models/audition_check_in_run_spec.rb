# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AuditionCheckInRun do
  describe 'a run left marked in progress by a worker that died' do
    let(:run) { described_class.create!(status: 'running', created_at: 11.minutes.ago) }

    it 'stops blocking a new run and reads as failed' do
      expect(described_class.in_progress).to be_nil
      expect(run).to be_failed
      expect(run.error_message).to include('never finished')
    end
  end

  it 'blocks a new run while one started recently is still going' do
    run = described_class.create!(status: 'queued')

    expect(described_class.in_progress).to eq(run)
  end
end
