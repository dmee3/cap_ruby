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
end
