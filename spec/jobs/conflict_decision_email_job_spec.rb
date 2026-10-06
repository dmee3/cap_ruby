# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ConflictDecisionEmailJob, type: :job do
  include ActiveJob::TestHelper
  include ActiveSupport::Testing::TimeHelpers

  let(:pending) { create(:conflict_status, name: 'Pending') }
  let(:approved) { create(:conflict_status, name: 'Approved') }
  let(:denied) { create(:conflict_status, name: 'Denied') }
  let(:resolved) { create(:conflict_status, name: 'Resolved') }
  let(:conflict) { create(:conflict, conflict_status: pending) }

  before { allow(PostOffice).to receive(:send_email) }

  def decide(status)
    travel(1.second)
    conflict.update!(status_id: status.id)
  end

  def run_scheduled_jobs
    perform_enqueued_jobs(only: described_class, at: 1.year.from_now)
  end

  it 'emails the member once the decision settles' do
    decide(approved)

    expect(PostOffice).not_to have_received(:send_email)
    run_scheduled_jobs

    expect(PostOffice).to have_received(:send_email)
      .once.with(conflict.user.email, a_string_including('was approved'), anything)
    expect(conflict.reload.notified_status_id).to eq(approved.id)
  end

  it 'waits out the triage undo window before reading the status' do
    triage = Rails.root.join('app/javascript/react/widgets/conflicts/ConflictTriage.tsx').read
    undo_ms = triage[/const UNDO_MS = (\d+)/, 1].to_i

    expect(undo_ms).to be_positive
    expect(described_class::DELAY).to be > (undo_ms / 1000).seconds
  end

  it 'sends one email about where a changed mind finally landed' do
    decide(approved)
    decide(denied)

    run_scheduled_jobs

    expect(PostOffice).to have_received(:send_email).once
    expect(PostOffice).to have_received(:send_email)
      .with(anything, a_string_including('was denied'), anything)
  end

  it 'leaves a decision still inside its undo window to the job that save scheduled' do
    decide(approved)
    first_job = enqueued_jobs.first
    decide(denied)

    described_class.perform_now(*first_job['arguments'])

    expect(PostOffice).not_to have_received(:send_email)
  end

  it 'sends nothing when the decision is undone back to pending' do
    decide(approved)
    decide(pending)

    run_scheduled_jobs

    expect(PostOffice).not_to have_received(:send_email)
  end

  it 'sends nothing when a decision is put back to the one the member already has' do
    conflict.update_columns(status_id: approved.id, notified_status_id: approved.id)

    decide(denied)
    decide(approved)
    run_scheduled_jobs

    expect(PostOffice).not_to have_received(:send_email)
  end

  it 'is superseded by an edit made after the decision' do
    decide(approved)
    travel(1.second)
    conflict.update!(reason: 'Rescheduled exam')

    run_scheduled_jobs

    expect(PostOffice).to have_received(:send_email).once
  end

  it 'does not announce resolving a conflict' do
    decide(resolved)

    run_scheduled_jobs

    expect(PostOffice).not_to have_received(:send_email)
  end

  it 'does not announce a conflict filed already decided' do
    create(:conflict, conflict_status: approved)

    run_scheduled_jobs

    expect(PostOffice).not_to have_received(:send_email)
  end

  it 'leaves the member untold when the send fails, so a retry still sends' do
    allow(PostOffice).to receive(:send_email).and_raise(StandardError, 'Mailgun down')
    decide(approved)

    expect { run_scheduled_jobs }.to raise_error(StandardError, 'Mailgun down')
    expect(conflict.reload.notified_status_id).to be_nil
  end

  it 'does nothing for a conflict deleted before it ran' do
    decide(approved)
    conflict.destroy

    run_scheduled_jobs

    expect(PostOffice).not_to have_received(:send_email)
  end
end
