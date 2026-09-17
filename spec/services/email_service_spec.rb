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
    let(:dana) { create(:user, email: 'dana@example.com', whistleblower_recipient: true) }
    let(:juli) { create(:user, email: 'juli@example.com', whistleblower_recipient: true) }
    let(:recipient_ids) { [dana.id, juli.id] }

    it 'sends the report to the chosen recipients' do
      EmailService.send_whistleblower_email('reporter@example.com', report, recipient_ids)

      expect(PostOffice).to have_received(:send_email) do |emails, subject, text|
        expect(emails).to match_array(['dana@example.com', 'juli@example.com'])
        expect(subject).to eq('Whistleblower Report')
        expect(text).to include('reporter@example.com')
        expect(text).to include(report)
      end
    end

    it 'marks the report anonymous when no contact address is given' do
      EmailService.send_whistleblower_email('', report, recipient_ids)

      expect(PostOffice).to have_received(:send_email) do |_emails, _subject, text|
        expect(text).to include('(Anonymous)')
      end
    end

    # The old version mapped each name to an EMAIL_<NAME> variable and compacted
    # the result, so an unset variable quietly shrank the list and a report the
    # reporter sent to three people could reach two.
    it 'refuses to send at all when a chosen recipient has no address' do
      unreachable = create(:user, whistleblower_recipient: true)
      unreachable.update_column(:email, '')

      expect do
        EmailService.send_whistleblower_email('r@example.com', report, [dana.id, unreachable.id])
      end.to raise_error(EmailService::UndeliverableReport, /1 of 2/)

      expect(PostOffice).not_to have_received(:send_email)
    end

    it 'refuses to route a report to someone outside the recipient pool' do
      outsider = create(:user, whistleblower_recipient: false)

      expect do
        EmailService.send_whistleblower_email('r@example.com', report, [dana.id, outsider.id])
      end.to raise_error(EmailService::UndeliverableReport)

      expect(PostOffice).not_to have_received(:send_email)
    end
  end
end
