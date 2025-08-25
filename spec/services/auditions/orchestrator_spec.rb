# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::Orchestrator do
  include AuditionsHelpers

  let(:service) { described_class.new }

  before do
    mock_google_sheets_api
    # Mock recruitment spreadsheet as not configured by default
    allow(Auditions::Configuration).to receive(:recruitment_spreadsheet_id).and_return(nil)
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
        expect(result.data[:recruitment_updated]).to be false
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
      recruitment_updater = double('RecruitmentUpdater')

      allow(data_fetcher).to receive(:call).and_return(Auditions::Result.success([]))
      allow(profile_builder).to receive(:call).and_return(
        Auditions::Result.success({ profiles: [], registrations: [], packets: [] })
      )
      allow(sheet_writer).to receive(:call).and_return(
        Auditions::Result.success({ packets_count: 0, registrations_count: 0 })
      )
      allow(recruitment_updater).to receive(:call)

      orchestrator = described_class.new(
        data_fetcher: data_fetcher,
        profile_builder: profile_builder,
        sheet_writer: sheet_writer,
        recruitment_updater: recruitment_updater
      )

      result = orchestrator.call

      expect(result).to be_success
      expect(data_fetcher).to have_received(:call)
      expect(profile_builder).to have_received(:call)
      expect(sheet_writer).to have_received(:call)
      # recruitment_updater should not be called when no spreadsheet ID is configured
      expect(recruitment_updater).not_to have_received(:call)
    end

    context 'when recruitment spreadsheet is configured' do
      before do
        allow(Auditions::Configuration).to receive(:recruitment_spreadsheet_id).and_return('test-recruitment-id')
      end

      it 'updates recruitment sheets when configured' do
        with_test_auditions_year('2026') do
          mock_squarespace_api_with_success

          # Mock recruitment updater to succeed
          recruitment_updater = double('RecruitmentUpdater')
          allow(recruitment_updater).to receive(:call).and_return(
            Auditions::Result.success({ tabs_updated: 9, profiles_processed: 2 })
          )

          orchestrator = described_class.new(recruitment_updater: recruitment_updater)

          result = orchestrator.call

          expect(result).to be_success
          expect(result.data[:recruitment_updated]).to be true
          expect(recruitment_updater).to have_received(:call)
        end
      end

      it 'fails when recruitment update fails' do
        with_test_auditions_year('2026') do
          mock_squarespace_api_with_success

          recruitment_updater = double('RecruitmentUpdater')
          allow(recruitment_updater).to receive(:call).and_return(
            Auditions::Result.failure(['Recruitment sheet update failed'])
          )

          orchestrator = described_class.new(recruitment_updater: recruitment_updater)

          result = orchestrator.call

          expect(result).to be_failure
          expect(result.errors).to include('Recruitment sheet update failed')
        end
      end
    end
  end
end
