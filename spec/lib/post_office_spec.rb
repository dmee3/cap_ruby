# frozen_string_literal: true

# TODO: this should be spec_helper but for some reason it's broken
require 'rails_helper'

RSpec.describe PostOffice do
  let(:subject) { 'Test email' }
  let(:text) { 'This is a test email' }

  describe '.send_email' do
    let(:fake_client) { instance_double(Mailgun::Client) }
    before do
      allow(Mailgun::Client).to receive(:new).and_return(fake_client)
      allow(fake_client).to receive(:enable_test_mode!)
    end

    context 'with a single recipient' do
      let(:recipients) { 'admin@example.com' }

      let(:expected_args) do
        {
          from: "donotreply@#{ENV.fetch('MAILGUN_DOMAIN', nil)}",
          to: recipients,
          subject: subject,
          text: text
        }
      end

      it 'sends an email' do
        expect(fake_client)
          .to receive(:send_message)
          .with(ENV.fetch('MAILGUN_DOMAIN', nil), **expected_args)

        PostOffice.send_email(recipients, subject, text)
      end
    end

    context 'with a single recipient (array)' do
      let(:recipients) { ['admin@example.com'] }

      let(:expected_args) do
        {
          from: "donotreply@#{ENV.fetch('MAILGUN_DOMAIN', nil)}",
          to: recipients.first,
          subject: subject,
          text: text
        }
      end

      it 'sends an email' do
        expect(fake_client)
          .to receive(:send_message)
          .with(ENV.fetch('MAILGUN_DOMAIN', nil), **expected_args)

        PostOffice.send_email(recipients, subject, text)
      end
    end

    context 'with multiple recipients (array)' do
      let(:recipients) do
        ['admin@example.com', 'coordinator-1@example.com', 'coordinator-2@example.com']
      end

      let(:expected_args) do
        {
          from: "donotreply@#{ENV.fetch('MAILGUN_DOMAIN', nil)}",
          to: recipients.first,
          cc: recipients[1..].join(','),
          subject: subject,
          text: text
        }
      end

      it 'sends an email' do
        expect(fake_client)
          .to receive(:send_message)
          .with(ENV.fetch('MAILGUN_DOMAIN', nil), **expected_args)

        PostOffice.send_email(recipients, subject, text)
      end
    end
  end

  # Mailgun's test mode is the only safeguard on this path: PostOffice bypasses
  # ActionMailer and therefore MailerInterceptor.
  describe 'test mode by deploy environment' do
    let(:fake_client) { instance_double(Mailgun::Client) }

    before do
      allow(Mailgun::Client).to receive(:new).and_return(fake_client)
      allow(fake_client).to receive(:send_message)
    end

    def stub_staging(value)
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('STAGING').and_return(value)
    end

    def in_rails_env(name)
      allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new(name))
    end

    context 'on the real production deploy' do
      before do
        in_rails_env('production')
        stub_staging(nil)
      end

      it 'disables test mode so mail actually sends' do
        expect(fake_client).to receive(:disable_test_mode!)

        PostOffice.send_email('admin@example.com', subject, text)
      end

      it 'does not prefix the subject' do
        allow(fake_client).to receive(:disable_test_mode!)
        expect(fake_client)
          .to receive(:send_message)
          .with(anything, hash_including(subject: 'Test email'))

        PostOffice.send_email('admin@example.com', subject, text)
      end
    end

    context 'on staging (production Rails env with STAGING set)' do
      before do
        in_rails_env('production')
        stub_staging('true')
      end

      it 'keeps test mode ENABLED so nothing reaches real members' do
        expect(fake_client).to receive(:enable_test_mode!)
        expect(fake_client).not_to receive(:disable_test_mode!)

        PostOffice.send_email('admin@example.com', subject, text)
      end

      it 'prefixes the subject with [STAGING - ignore]' do
        allow(fake_client).to receive(:enable_test_mode!)
        expect(fake_client)
          .to receive(:send_message)
          .with(anything, hash_including(subject: '[STAGING - ignore] Test email'))

        PostOffice.send_email('admin@example.com', subject, text)
      end
    end

    context 'in every other environment' do
      before do
        in_rails_env('development')
        stub_staging(nil)
      end

      it 'keeps test mode enabled' do
        expect(fake_client).to receive(:enable_test_mode!)

        PostOffice.send_email('admin@example.com', subject, text)
      end

      it 'does not prefix the subject' do
        allow(fake_client).to receive(:enable_test_mode!)
        expect(fake_client)
          .to receive(:send_message)
          .with(anything, hash_including(subject: 'Test email'))

        PostOffice.send_email('admin@example.com', subject, text)
      end
    end
  end
end
