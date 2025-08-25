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
          # Mock the external APIs that the new architecture calls
          expect(External::SquarespaceApi).to receive(:orders).once.and_return([
                                                                                 sample_packet_order, sample_registration_order
                                                                               ])
          expect(External::GoogleSheetsApi).to receive(:clear_sheet).twice
          # NOTE: format_sheet is skipped in the new simplified architecture
          expect(External::GoogleSheetsApi).to receive(:write_sheet).twice

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
        allow(External::GoogleSheetsApi).to receive(:write_sheet)
          .and_raise(StandardError, 'Sheets API error')

        with_test_auditions_year('2026') do
          result = described_class.update

          expect(result).to be_failure
          expect(result).to have_error_containing('Sheets API error')
        end
      end

      it 'returns failure when data validation fails' do
        mock_squarespace_api_with_success([sample_invalid_order])

        result = described_class.update

        expect(result).to be_failure
        expect(result).to have_error_containing('missing customer email')
      end
    end

    context 'with invalid data' do
      it 'handles validation failures gracefully' do
        with_test_auditions_year('2026') do
          # Set up invalid data
          invalid_orders = [sample_invalid_order]
          mock_squarespace_api_with_success(invalid_orders)

          result = described_class.update

          expect(result).to be_failure
          expect(result).to have_error_containing('missing customer email')
        end
      end
    end

    context 'error logging and recovery' do
      it 'logs step progression' do
        mock_squarespace_api_with_success

        capture_logs do |logs|
          with_test_auditions_year('2026') do
            described_class.update
          end

          expect(logs).to have_received(:info).with(match(/Starting Auditions spreadsheet update/))
          expect(logs).to have_received(:info).with(match(/Starting Execute auditions data processing workflow/))
          expect(logs).to have_received(:info).with(match(/Orders fetched and validated successfully/))
          expect(logs).to have_received(:info).with(match(/Profiles built successfully/))
          expect(logs).to have_received(:info).with(match(/Spreadsheet update completed successfully/)).at_least(:once)
        end
      end

      it 'handles unexpected errors gracefully' do
        # Mock an unexpected error in the orchestrator
        allow_any_instance_of(Auditions::Orchestrator).to receive(:call)
          .and_raise(StandardError, 'Unexpected system error')

        result = described_class.update

        expect(result).to be_failure
        expect(result).to have_error_containing('Unexpected error during spreadsheet update')
      end
    end
  end

  describe 'integration with new architecture' do
    it 'uses the orchestrator for workflow coordination' do
      with_test_auditions_year('2026') do
        mock_squarespace_api_with_success

        # Verify the service creates an orchestrator and delegates to it
        expect_any_instance_of(Auditions::Orchestrator).to receive(:call).and_call_original

        result = described_class.update
        expect(result).to be_success
      end
    end

    it 'transforms orchestrator results for backward compatibility' do
      with_test_auditions_year('2026') do
        mock_squarespace_api_with_success

        result = described_class.update

        # Should have the expected fields for backward compatibility
        expect(result.data).to have_key(:registrations_processed)
        expect(result.data).to have_key(:packets_processed)
        expect(result.data).to have_key(:profiles_created)
      end
    end
  end
end
