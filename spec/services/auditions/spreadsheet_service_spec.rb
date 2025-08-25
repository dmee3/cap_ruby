# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::SpreadsheetService do
  include AuditionsHelpers

  describe '.update' do
    before do
      mock_google_sheets_api
    end

    context 'with successful end-to-end execution' do
      before do
        mock_squarespace_api_with_success
      end

      it 'completes full workflow successfully' do
        with_test_auditions_year('2026') do
          result = described_class.update

          expect(result).to be_success
          expect(result.data[:registrations_processed]).to eq(1)
          expect(result.data[:packets_processed]).to eq(1)
          expect(result.data[:profiles_created]).to eq(2) # 1 registration + 1 packet = 2 profiles
        end
      end

      it 'calls all required external services' do
        with_test_auditions_year('2026') do
          # Mock the writer service
          expect(Auditions::PacketAndRegistrationWriterService).to receive(:write_data).once
          expect(Auditions::RecruitmentSheetUpdaterService).to receive(:update).once

          described_class.update
        end
      end

      it 'processes profiles correctly' do
        with_test_auditions_year('2026') do
          result = described_class.update

          expect(result).to be_success
          # Should create separate profiles for packet and registration users
          expect(result.data[:profiles_created]).to eq(2)
        end
      end
    end

    context 'with API failures' do
      it 'returns failure when order fetching fails' do
        mock_squarespace_api_with_failure(Faraday::TimeoutError)

        result = described_class.update

        expect(result).to be_failure
        expect(result).to have_error_containing('timeout')
      end

      it 'returns failure when spreadsheet writing fails' do
        mock_squarespace_api_with_success
        allow(Auditions::PacketAndRegistrationWriterService).to receive(:write_data)
          .and_raise(StandardError, 'Sheets API error')

        with_test_auditions_year('2026') do
          result = described_class.update

          expect(result).to be_failure
          expect(result).to have_error_containing('Failed to write to spreadsheets')
        end
      end

      it 'returns failure when recruitment update fails' do
        mock_squarespace_api_with_success
        allow(Auditions::PacketAndRegistrationWriterService).to receive(:write_data)
        allow(Auditions::RecruitmentSheetUpdaterService).to receive(:update)
          .and_raise(StandardError, 'Recruitment error')

        with_test_auditions_year('2026') do
          result = described_class.update

          expect(result).to be_failure
          expect(result).to have_error_containing('Failed to update recruitment sheet')
        end
      end
    end

    context 'with invalid data' do
      it 'handles validation failures gracefully' do
        invalid_orders = [sample_invalid_order]
        mock_squarespace_api_with_success(invalid_orders)

        result = described_class.update

        expect(result).to be_failure
        expect(result).to have_error_containing('missing customer email')
      end

      it 'handles profile creation failures' do
        mock_squarespace_api_with_success
        allow(Auditions::PacketAndRegistrationWriterService).to receive(:write_data)

        # Mock profile validation to fail
        allow(Auditions::DataValidator).to receive(:validate_profiles)
          .and_return(Auditions::Result.failure(['Invalid profiles']))

        with_test_auditions_year('2026') do
          result = described_class.update

          expect(result).to be_failure
          expect(result).to have_error_containing('Invalid profiles')
        end
      end
    end

    context 'error logging and recovery' do
      it 'logs step progression' do
        mock_squarespace_api_with_success
        allow(Auditions::PacketAndRegistrationWriterService).to receive(:write_data)
        allow(Auditions::RecruitmentSheetUpdaterService).to receive(:update)

        capture_logs do |logs|
          with_test_auditions_year('2026') do
            described_class.update
          end

          expect(logs).to have_received(:info).with(match(/Starting Auditions spreadsheet update/))
          expect(logs).to have_received(:info).with(match(/Data fetch completed/))
          expect(logs).to have_received(:info).with(match(/Writing data to spreadsheets/))
          expect(logs).to have_received(:info).with(match(/Creating profiles from data/))
        end
      end

      it 'handles unexpected errors gracefully' do
        # Mock an unexpected error in the middle of processing
        allow(Auditions::OrderService).to receive(:fetch_items)
          .and_raise(StandardError, 'Unexpected system error')

        result = described_class.update

        expect(result).to be_failure
        expect(result).to have_error_containing('Unexpected error during spreadsheet update')
      end
    end
  end

  describe 'private methods' do
    let(:service_class) { described_class }
    let(:packets) { [double('Packet')] }
    let(:registrations) { [double('Registration')] }
    let(:profiles) { [double('Profile')] }

    describe '.write_data_with_error_handling' do
      it 'succeeds when PacketAndRegistrationWriterService succeeds' do
        allow(Auditions::PacketAndRegistrationWriterService).to receive(:write_data)

        result = service_class.send(:write_data_with_error_handling, packets, registrations)

        expect(result).to be_success
      end

      it 'returns failure when PacketAndRegistrationWriterService raises error' do
        allow(Auditions::PacketAndRegistrationWriterService).to receive(:write_data)
          .and_raise(StandardError, 'Write failed')

        result = service_class.send(:write_data_with_error_handling, packets, registrations)

        expect(result).to be_failure
        expect(result).to have_error_containing('Failed to write to spreadsheets')
      end
    end

    describe '.update_recruitment_with_error_handling' do
      it 'succeeds when RecruitmentSheetUpdaterService succeeds' do
        allow(Auditions::RecruitmentSheetUpdaterService).to receive(:update)

        result = service_class.send(:update_recruitment_with_error_handling, profiles)

        expect(result).to be_success
      end

      it 'returns failure when RecruitmentSheetUpdaterService raises error' do
        allow(Auditions::RecruitmentSheetUpdaterService).to receive(:update)
          .and_raise(StandardError, 'Update failed')

        result = service_class.send(:update_recruitment_with_error_handling, profiles)

        expect(result).to be_failure
        expect(result).to have_error_containing('Failed to update recruitment sheet')
      end
    end

    describe '.find_existing_profile' do
      let(:packet) do
        double('Packet',
               first_name: 'John',
               last_name: 'Doe',
               email: 'john@example.com')
      end

      let(:matching_profile) do
        double('Profile',
               first_name: 'John',
               last_name: 'Doe',
               email: 'john@example.com')
      end

      let(:different_profile) do
        double('Profile',
               first_name: 'Jane',
               last_name: 'Smith',
               email: 'jane@example.com')
      end

      it 'finds matching profile by name and email' do
        profiles = [different_profile, matching_profile]

        result = service_class.send(:find_existing_profile, packet, profiles)

        expect(result).to eq(matching_profile)
      end

      it 'returns nil when no matching profile found' do
        profiles = [different_profile]

        result = service_class.send(:find_existing_profile, packet, profiles)

        expect(result).to be_nil
      end

      it 'handles case-insensitive matching' do
        allow(matching_profile).to receive(:first_name).and_return('JOHN')
        allow(matching_profile).to receive(:last_name).and_return('DOE')
        allow(matching_profile).to receive(:email).and_return('JOHN@EXAMPLE.COM')
        profiles = [matching_profile]

        result = service_class.send(:find_existing_profile, packet, profiles)

        expect(result).to eq(matching_profile)
      end

      it 'handles missing profile data gracefully' do
        incomplete_profile = double('Profile', first_name: '', last_name: nil, email: nil)
        profiles = [incomplete_profile]

        result = service_class.send(:find_existing_profile, packet, profiles)

        expect(result).to be_nil
      end

      it 'handles blank packet email' do
        allow(packet).to receive(:email).and_return('')
        profiles = [matching_profile]

        result = service_class.send(:find_existing_profile, packet, profiles)

        expect(result).to be_nil
      end
    end

    describe 'profile creation and merging' do
      it 'creates separate profiles when no matches found' do
        with_test_auditions_year('2026') do
          # Create sample data with different emails
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

          profiles = service_class.send(:create_profiles_from_registrations_and_packets,
                                        [registration], [packet])

          expect(profiles.size).to eq(2)
          expect(profiles.map(&:email)).to contain_exactly('registration@example.com',
                                                           'packet@example.com')
        end
      end

      it 'merges profiles when matches found' do
        with_test_auditions_year('2026') do
          # Create sample data with same email
          same_email = 'same@example.com'

          packet_item = sample_packet_order['lineItems'].first
          packet = Auditions::Packet.new(
            date: DateTime.current,
            item: packet_item,
            email: same_email
          )

          # Modify registration to have same name and email as packet
          registration_item = sample_registration_order['lineItems'].first.dup
          registration_item['customizations'].find do |c|
            c['label'] == 'First Name'
          end['value'] = 'John'
          registration_item['customizations'].find do |c|
            c['label'] == 'Last Name'
          end['value'] = 'Doe'

          registration = Auditions::Registration.new(
            date: DateTime.current,
            item: registration_item,
            email: same_email
          )

          profiles = service_class.send(:create_profiles_from_registrations_and_packets,
                                        [registration], [packet])

          expect(profiles.size).to eq(1) # Should merge into one profile
          expect(profiles.first.email).to eq(same_email)
        end
      end

      it 'handles profile creation errors gracefully' do
        with_test_auditions_year('2026') do
          # Mock registration creation to fail
          failing_registration = double('Registration', email: 'failing@example.com')
          allow(failing_registration).to receive(:first_name).and_raise(StandardError,
                                                                        'Registration error')

          valid_packet = Auditions::Packet.new(
            date: DateTime.current,
            item: sample_packet_order['lineItems'].first,
            email: 'packet@example.com'
          )

          profiles = service_class.send(:create_profiles_from_registrations_and_packets,
                                        [failing_registration], [valid_packet])

          # Should still create profile from packet despite registration failure
          expect(profiles.size).to eq(1)
          expect(profiles.first.email).to eq('packet@example.com')
        end
      end
    end
  end
end
