# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MailerInterceptor do
  let(:message) do
    Mail.new(
      to: 'real.member@example.com',
      subject: 'Your dues are due',
      body: 'Pay up'
    )
  end

  def stub_env(staging: nil, email_dan: nil)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:[]).with('STAGING').and_return(staging)
    allow(ENV).to receive(:fetch).with('EMAIL_DAN', nil).and_return(email_dan)
  end

  def in_rails_env(name)
    allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new(name))
  end

  context 'on the real production deploy' do
    before do
      in_rails_env('production')
      stub_env(staging: nil, email_dan: 'dan@example.com')
    end

    it 'leaves real mail completely alone' do
      described_class.delivering_email(message)

      expect(message.to).to eq(['real.member@example.com'])
      expect(message.subject).to eq('Your dues are due')
      expect(message.perform_deliveries).to be true
    end
  end

  context 'on staging (production Rails env with STAGING set)' do
    before { in_rails_env('production') }

    context 'with EMAIL_DAN configured' do
      before { stub_env(staging: 'true', email_dan: 'dan@example.com') }

      it 'redirects the recipient away from the real member' do
        described_class.delivering_email(message)

        expect(message.to).to eq(['dan@example.com'])
      end

      it 'records the original recipient in the subject' do
        described_class.delivering_email(message)

        expect(message.subject).to eq('[NOT PROD] Your dues are due | TO ["real.member@example.com"]')
      end

      it 'still delivers, so staging mail stays verifiable' do
        described_class.delivering_email(message)

        expect(message.perform_deliveries).to be true
      end
    end

    context 'with EMAIL_DAN unset' do
      before { stub_env(staging: 'true', email_dan: nil) }

      it 'suppresses the delivery entirely' do
        described_class.delivering_email(message)

        expect(message.perform_deliveries).to be false
      end

      it 'does not fall back to the real recipient' do
        described_class.delivering_email(message)

        expect(message.to).to eq(['real.member@example.com'])
        expect(message.perform_deliveries).to be false
      end
    end
  end

  context 'in development' do
    before { in_rails_env('development') }

    context 'with EMAIL_DAN configured' do
      before { stub_env(staging: nil, email_dan: 'dan@example.com') }

      it 'redirects and annotates the subject' do
        described_class.delivering_email(message)

        expect(message.to).to eq(['dan@example.com'])
        expect(message.subject).to start_with('[NOT PROD] ')
      end
    end

    context 'with EMAIL_DAN unset' do
      before { stub_env(staging: nil, email_dan: nil) }

      # Deliberately unlike staging: :letter_opener sends nothing, and blanking
      # the recipient is what broke Devise's reset spec.
      it 'leaves the recipient alone and still delivers' do
        described_class.delivering_email(message)

        expect(message.to).to eq(['real.member@example.com'])
        expect(message.perform_deliveries).to be true
      end

      it 'never blanks the recipient' do
        described_class.delivering_email(message)

        expect(message.to).to be_present
      end
    end
  end
end
