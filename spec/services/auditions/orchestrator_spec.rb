# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::Orchestrator do
  include AuditionsHelpers

  let(:service) { described_class.new }

  before do
    mock_google_sheets_api
  end

  describe '#call' do
    it 'successfully orchestrates the complete workflow' do
      with_test_auditions_year('2026') do
        mock_squarespace_api_with_success

        result = service.call

        expect(result).to be_success
        expect(result.data[:orders_count]).to eq(2)
        expect(result.data[:profiles_count]).to eq(2)
        expect(result.data[:registrations_count]).to eq(1)
        expect(result.data[:packets_count]).to eq(1)
      end
    end

    it 'fails when data fetching fails' do
      mock_squarespace_api_with_failure(Faraday::TimeoutError)

      result = service.call

      expect(result).to be_failure
      expect(result).to have_error_containing('timeout')
    end

    it 'fails when profile building fails' do
      with_test_auditions_year('2026') do
        mock_squarespace_api_with_success([sample_invalid_order])

        result = service.call

        expect(result).to be_failure
        expect(result).to have_error_containing('missing customer email')
      end
    end

    it 'fails when sheet writing fails' do
      with_test_auditions_year('2026') do
        mock_squarespace_api_with_success
        allow(External::GoogleSheetsApi).to receive(:write_sheet)
          .and_raise(StandardError, 'Write failed')

        result = service.call

        expect(result).to be_failure
      end
    end

    it 'uses dependency injection for services' do
      data_fetcher = double('DataFetcher')
      profile_builder = double('ProfileBuilder')
      sheet_writer = double('SheetWriter')

      allow(data_fetcher).to receive(:call).and_return(Auditions::Result.success([]))
      allow(profile_builder).to receive(:call).and_return(
        Auditions::Result.success({ profiles: [], registrations: [], packets: [] })
      )
      allow(sheet_writer).to receive(:call).and_return(
        Auditions::Result.success({ packets_count: 0, registrations_count: 0 })
      )

      orchestrator = described_class.new(
        data_fetcher: data_fetcher,
        profile_builder: profile_builder,
        sheet_writer: sheet_writer
      )

      result = orchestrator.call

      expect(result).to be_success
      expect(data_fetcher).to have_received(:call)
      expect(profile_builder).to have_received(:call)
      expect(sheet_writer).to have_received(:call)
    end
  end
end
