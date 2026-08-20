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
        expect(External::GoogleSheetsApi).to receive(:unmerge_sheet).twice
        expect(External::GoogleSheetsApi).to receive(:write_sheet).twice
        expect(External::GoogleSheetsApi).to receive(:format_sheet).twice

        service.call(profiles)
      end
    end

    it 'unmerges the sheet before writing values, so stale merges from a prior run cannot swallow new data' do
      with_test_auditions_year('2026') do
        call_order = []
        allow(External::GoogleSheetsApi).to receive(:unmerge_sheet) { call_order << :unmerge_sheet }
        allow(External::GoogleSheetsApi).to receive(:write_sheet) { call_order << :write_sheet }

        service.call(profiles)

        packets_calls = call_order.first(2)
        expect(packets_calls).to eq(%i[unmerge_sheet write_sheet])
      end
    end

    it 'sorts packets and registrations by last name, then first name, instead of by date' do
      with_test_auditions_year('2026') do
        written_data = { packets: nil, registrations: nil }
        allow(External::GoogleSheetsApi).to receive(:write_sheet) do |_id, sheet_name, data, **|
          if sheet_name == Auditions::Configuration.packets_sheet_name
            written_data[:packets] = data
          else
            written_data[:registrations] = data
          end
        end

        packet_item = sample_packet_order['lineItems'].first
        make_packet = lambda do |name|
          item = packet_item.deep_dup
          item['customizations'].find { |c| c['label'] == 'Name' }['value'] = name
          Auditions::Packet.new(date: DateTime.current, item: item, email: "#{name}@example.com")
        end

        registration_item = sample_registration_order['lineItems'].first
        make_registration = lambda do |first, last|
          item = registration_item.deep_dup
          item['customizations'].find { |c| c['label'] == 'First Name' }['value'] = first
          item['customizations'].find { |c| c['label'] == 'Last Name' }['value'] = last
          Auditions::Registration.new(date: DateTime.current, item: item, email: "#{first}@example.com")
        end

        packets = [make_packet.call('Zack Young'), make_packet.call('Amy Adams')]
        registrations = [make_registration.call('Zack', 'Young'), make_registration.call('Amy', 'Adams')]

        profiles = packets.map do |packet|
          Auditions::Profile.new(first_name: packet.first_name, last_name: packet.last_name,
                                 email: packet.email, packet: packet)
        end
        profiles += registrations.map do |registration|
          Auditions::Profile.new(first_name: registration.first_name, last_name: registration.last_name,
                                 email: registration.email, registration: registration)
        end

        service.call(profiles)

        packet_names = written_data[:packets].select { |row| row.size >= 2 && %w[Adams Young].include?(row[1]) }
        expect(packet_names.map { |row| row[1] }).to eq(%w[Adams Young])

        registration_names = written_data[:registrations].select do |row|
          row.size >= 2 && %w[Adams Young].include?(row[1])
        end
        expect(registration_names.map { |row| row[1] }).to eq(%w[Adams Young])
      end
    end
  end
end
