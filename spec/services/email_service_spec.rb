# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EmailService do
  before do
    # Stub PostOffice to avoid actually sending emails
    allow(PostOffice).to receive(:send_email)
    # Stub Rollbar to avoid error reporting in tests
    allow(Rollbar).to receive(:error)
  end

  describe '.send_payment_submitted_email' do
    let(:user) { create(:user, first_name: 'John', last_name: 'Doe') }
    let(:payment_type) { create(:payment_type, name: 'Stripe') }
    let(:season) { create(:season) }
    let(:payment) do
      create(
        :payment,
        user: user,
        season: season,
        amount: 25000, # $250.00
        payment_type: payment_type
      )
    end

    it 'sends email with correct subject and amount' do
      EmailService.send_payment_submitted_email(payment, user)

      expect(PostOffice).to have_received(:send_email).twice.with(
        anything,
        'Payment submitted by John Doe for $250',
        'John Doe has submitted a payment for $250.'
      )
    end

    it 'sends to configured admin emails' do
      allow(ENV).to receive(:fetch).with('EMAIL_AARON', nil).and_return('aaron@example.com')
      allow(ENV).to receive(:fetch).with('EMAIL_DAN', nil).and_return('dan@example.com')

      EmailService.send_payment_submitted_email(payment, user)

      expect(PostOffice).to have_received(:send_email).with(
        'aaron@example.com',
        anything,
        anything
      )
      expect(PostOffice).to have_received(:send_email).with(
        'dan@example.com',
        anything,
        anything
      )
    end

    it 'handles errors gracefully' do
      allow(PostOffice).to receive(:send_email).and_raise(StandardError.new('Email failed'))

      expect do
        EmailService.send_payment_submitted_email(payment, user)
      end.not_to raise_error

      expect(Rollbar).to have_received(:error)
    end
  end

  describe '.send_conflict_submitted_email' do
    let(:season) { create(:season) }
    let(:user) { create(:user, first_name: 'Jane', last_name: 'Smith') }
    let(:conflict_status) { create(:conflict_status, name: 'Pending') }
    let(:conflict) do
      create(
        :conflict,
        user: user,
        season: season,
        conflict_status: conflict_status,
        start_date: 1.week.from_now,
        end_date: 2.weeks.from_now,
        reason: 'Family vacation'
      )
    end
    let!(:seasons_user) do
      create(
        :seasons_user,
        user: user,
        season: season,
        role: 'member',
        ensemble: 'World',
        section: 'Snare'
      )
    end

    before do
      # Create coordinators and admins to receive the email
      coordinator = create(:user)
      admin = create(:user)
      create(:seasons_user, user: coordinator, season: season, role: 'coordinator')
      create(:seasons_user, user: admin, season: season, role: 'admin')
    end

    it 'sends email with conflict details' do
      EmailService.send_conflict_submitted_email(conflict, user, season.id)

      expect(PostOffice).to have_received(:send_email) do |_recipients, subject, text|
        expect(subject).to eq('Conflict submitted by Jane Smith')
        expect(text).to include('Jane Smith has submitted a conflict')
        expect(text).to include('World Snare')
        expect(text).to include('Family vacation')
      end
    end

    it 'sends to coordinators and admins for the season' do
      EmailService.send_conflict_submitted_email(conflict, user, season.id)

      expect(PostOffice).to have_received(:send_email) do |recipients, _subject, _text|
        expect(recipients).to be_an(Array)
        expect(recipients.size).to eq(2) # 1 coordinator + 1 admin
      end
    end

    it 'handles errors gracefully' do
      allow(PostOffice).to receive(:send_email).and_raise(StandardError.new('Email failed'))

      expect do
        EmailService.send_conflict_submitted_email(conflict, user, season.id)
      end.not_to raise_error

      expect(Rollbar).to have_received(:error)
    end
  end

  describe '.send_whistleblower_email' do
    let(:report) { 'This is a test whistleblower report about inappropriate behavior.' }
    let(:recipients) { %w[aaron dan] }

    before do
      allow(ENV).to receive(:fetch).with('EMAIL_AARON', nil).and_return('aaron@example.com')
      allow(ENV).to receive(:fetch).with('EMAIL_DAN', nil).and_return('dan@example.com')
    end

    it 'sends email with report content' do
      EmailService.send_whistleblower_email('reporter@example.com', report, recipients)

      expect(PostOffice).to have_received(:send_email) do |_emails, subject, text|
        expect(subject).to eq('Whistleblower Report')
        expect(text).to include('reporter@example.com')
        expect(text).to include(report)
      end
    end

    it 'marks email as anonymous if not provided' do
      EmailService.send_whistleblower_email('', report, recipients)

      expect(PostOffice).to have_received(:send_email) do |_emails, _subject, text|
        expect(text).to include('(Anonymous)')
      end
    end

    it 'sends to mapped admin emails from environment' do
      EmailService.send_whistleblower_email('reporter@example.com', report, recipients)

      expect(PostOffice).to have_received(:send_email).with(
        ['aaron@example.com', 'dan@example.com'],
        anything,
        anything
      )
    end

    it 'filters out missing environment variables' do
      allow(ENV).to receive(:fetch).with('EMAIL_AARON', nil).and_return(nil)
      allow(ENV).to receive(:fetch).with('EMAIL_DAN', nil).and_return('dan@example.com')

      EmailService.send_whistleblower_email('reporter@example.com', report, recipients)

      expect(PostOffice).to have_received(:send_email).with(
        ['dan@example.com'], # Only Dan's email
        anything,
        anything
      )
    end
  end
end
