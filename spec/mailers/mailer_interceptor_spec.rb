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

  # Both env inputs are stubbed, never read, so these pass identically with and
  # without a local .env — the trap that let a mail spec through CI in PR #242.
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

  # The case that had never been tested, and the whole point of the fix: staging
  # is RAILS_ENV=production with STAGING set, so it used to sail past the
  # interceptor's Rails.env.production? guard and mail real members for real.
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

      # Fails closed. There is nowhere safe to redirect to, and staging delivers
      # through Mailgun for real, so the delivery is dropped rather than allowed
      # to reach the real recipient.
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

      # Deliberately different from staging: development delivers via
      # :letter_opener, so nothing leaves the machine and suppressing would only
      # break the local workflow of previewing mail. Blanking the recipient is
      # what broke Devise's reset spec, so the address is left untouched.
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
