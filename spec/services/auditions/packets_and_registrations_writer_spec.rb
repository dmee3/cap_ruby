# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::PacketsAndRegistrationsWriter do
  include AuditionsHelpers

  let(:service) { described_class.new }
  let(:profiles) { create_sample_profiles }

  before do
    mock_google_sheets_api
  end

  def create_sample_profiles
    with_test_auditions_year('2026') do
      packet = Auditions::Packet.new(
        date: DateTime.current,
        item: sample_packet_order['lineItems'].first,
        email: 'packet@example.com'
      )

      registration = Auditions::Registration.new(
        date: DateTime.current,
        item: sample_registration_order['lineItems'].first,
        email: 'registration@example.com'
      )

      [
        Auditions::Profile.new(
          first_name: packet.first_name,
          last_name: packet.last_name,
          email: packet.email,
          packet: packet
        ),
        Auditions::Profile.new(
          first_name: registration.first_name,
          last_name: registration.last_name,
          email: registration.email,
          registration: registration
        )
      ]
    end
  end

  describe '#call' do
    it 'successfully writes profiles to spreadsheets' do
      with_test_auditions_year('2026') do
        result = service.call(profiles)

        expect(result).to be_success
        # Section header + Column header + Instrument header + 1 packet
        expect(result.data[:packets_count]).to eq(4)
        # Section header + Column header + Instrument header + 1 registration
        expect(result.data[:registrations_count]).to eq(4)
      end
    end

    it 'handles write errors gracefully' do
      with_test_auditions_year('2026') do
        allow(External::GoogleSheetsApi).to receive(:write_sheet)
          .and_raise(StandardError, 'Write failed')

        result = service.call(profiles)
        expect(result).to be_failure
      end
    end

    it 'calls clear and write for both sheets' do
      with_test_auditions_year('2026') do
        expect(External::GoogleSheetsApi).to receive(:clear_sheet).twice
        expect(External::GoogleSheetsApi).to receive(:write_sheet).twice
        expect(External::GoogleSheetsApi).to receive(:format_sheet).twice

        service.call(profiles)
      end
    end
  end
end
