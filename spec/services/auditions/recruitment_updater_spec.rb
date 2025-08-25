# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::RecruitmentUpdater do
  include AuditionsHelpers

  let(:service) { described_class.new }
  let(:profiles) { create_sample_profiles_for_recruitment }
  let(:mock_sheets_api) { instance_double(External::GoogleSheetsApi) }

  before do
    allow(External::GoogleSheetsApi).to receive(:new).and_return(mock_sheets_api)
    allow(Auditions::Configuration).to receive(:recruitment_spreadsheet_id).and_return('test-recruitment-id')
    allow(service).to receive(:sheets_api).and_return(mock_sheets_api)
  end

  def create_sample_profiles_for_recruitment
    with_test_auditions_year('2026') do
      # Profile with packet only
      packet_profile = Auditions::Profile.new(
        first_name: 'John',
        last_name: 'Drummer',
        email: 'john.drummer@example.com',
        packet: Auditions::Packet.new(
          date: DateTime.current,
          item: sample_packet_order['lineItems'].first,
          email: 'john.drummer@example.com'
        )
      )

      # Profile with registration only
      registration_profile = Auditions::Profile.new(
        first_name: 'Jane',
        last_name: 'Player',
        email: 'jane.player@example.com',
        registration: Auditions::Registration.new(
          date: DateTime.current,
          item: sample_registration_order['lineItems'].first,
          email: 'jane.player@example.com'
        )
      )

      # Profile with both packet and registration
      both_profile = Auditions::Profile.new(
        first_name: 'Alex',
        last_name: 'Musician',
        email: 'alex.musician@example.com',
        packet: Auditions::Packet.new(
          date: DateTime.current,
          item: sample_packet_order['lineItems'].first,
          email: 'alex.musician@example.com'
        ),
        registration: Auditions::Registration.new(
          date: DateTime.current,
          item: sample_registration_order['lineItems'].first,
          email: 'alex.musician@example.com'
        )
      )

      [packet_profile, registration_profile, both_profile]
    end
  end

  describe '#call' do
    let(:sample_existing_rows) do
      [
        ['VET', 'First Name', 'Last Name', 'Experience', 'Location', 'Email',
         'Status', 'Packet', 'Registered', 'Notes'],
        ['VET', 'Existing', 'Player', '', 'City, ST', 'existing@example.com', '', '',
         '', ''],
        ['', 'John', 'Drummer', '', 'Test City, TX', 'john.drummer@example.com', '', '', '', '']
      ]
    end

    before do
      # Mock successful sheet operations for all tabs
      described_class::TAB_NAMES.each do |tab_name|
        allow(mock_sheets_api).to receive(:read_sheet)
          .with('test-recruitment-id', tab_name)
          .and_return(sample_existing_rows.deep_dup)

        allow(mock_sheets_api).to receive(:write_sheet)
          .with('test-recruitment-id', tab_name, anything, formulae: true)
      end

      # Mock clear_sheet for UNSORTED tab
      allow(mock_sheets_api).to receive(:clear_sheet)
        .with('test-recruitment-id', 'UNSORTED')

      # Mock format_sheet for UNSORTED tab
      allow(mock_sheets_api).to receive(:format_sheet)
        .with('test-recruitment-id', 'UNSORTED', anything, anything, anything, anything)
    end

    context 'when recruitment spreadsheet is configured' do
      it 'successfully updates recruitment sheets' do
        result = service.call(profiles)

        expect(result).to be_success
        expect(result.data[:tabs_updated]).to eq(9) # All tab names (now 9 tabs including UNSORTED)
        expect(result.data[:profiles_processed]).to eq(3)
      end

      it 'calls read and write for each tab' do
        # Should read from original tabs only (not UNSORTED)
        described_class::ORIGINAL_TAB_NAMES.each do |tab_name|
          expect(mock_sheets_api).to receive(:read_sheet)
            .with('test-recruitment-id', tab_name)
            .and_return(sample_existing_rows.deep_dup)

          expect(mock_sheets_api).to receive(:write_sheet)
            .with('test-recruitment-id', tab_name, anything, formulae: true)
        end

        # Should write to UNSORTED tab (but not read from it)
        expect(mock_sheets_api).to receive(:write_sheet)
          .with('test-recruitment-id', 'UNSORTED', anything, formulae: true)

        service.call(profiles)
      end

      it 'updates existing rows with packet and registration status' do
        allow(mock_sheets_api).to receive(:write_sheet) do |_sheet_id, tab_name, rows, _options|
          # Find the row for John Drummer (who has a packet)
          john_row = rows.find { |row| row[1] == 'John' && row[2] == 'Drummer' }
          next unless john_row

          expect(john_row[7]).to eq('Y') # Packet downloaded column
          expect(john_row[9]).to include('downloaded') # Notes column should include download info

          # For multi-instrument tabs, should include instrument information
          if described_class::TAB_INSTRUMENT_MAPPING[tab_name]&.size&.> 1
            expect(john_row[9]).to include('Marked instrument as Snare')
          end
        end

        service.call(profiles)
      end

      it 'creates UNSORTED tab for profiles not in existing rows' do
        # Mock empty existing rows for original tabs to force all profiles to be new
        described_class::ORIGINAL_TAB_NAMES.each do |tab_name|
          allow(mock_sheets_api).to receive(:read_sheet)
            .with('test-recruitment-id', tab_name)
            .and_return([])
        end

        # Should clear the UNSORTED tab first, then write new content
        expect(mock_sheets_api).to receive(:clear_sheet)
          .with('test-recruitment-id', 'UNSORTED')
        expect(mock_sheets_api).to receive(:write_sheet)
          .with('test-recruitment-id', 'UNSORTED', anything, formulae: true)

        service.call(profiles)
      end

      it 'clears UNSORTED tab when no new profiles exist' do
        # Mock existing rows that contain all our test profiles (so none are "new")
        rows_with_all_profiles = [
          ['VET', 'First Name', 'Last Name', 'Experience', 'Location', 'Email',
           'Status', 'Packet', 'Registered', 'Notes'],
          ['', 'John', 'Drummer', '', 'Test City, OH', 'john.drummer@example.com', '', '', '',
           ''],
          ['VET', 'Jane', 'Player', '', 'Test City, OH', 'jane.player@example.com', '', '', '',
           ''],
          ['', 'Alex', 'Musician', '', 'Test City, OH', 'alex.musician@example.com', '', '',
           '', '']
        ]

        described_class::ORIGINAL_TAB_NAMES.each do |tab_name|
          allow(mock_sheets_api).to receive(:read_sheet)
            .with('test-recruitment-id', tab_name)
            .and_return(rows_with_all_profiles.deep_dup)
        end

        # Should clear the UNSORTED tab since no new profiles exist
        expect(mock_sheets_api).to receive(:write_sheet)
          .with('test-recruitment-id', 'UNSORTED', anything, formulae: true)

        service.call(profiles)
      end

      it 'adds instrument notes on subsequent updates even when packet info already exists' do
        # Create existing rows that already have packet info but no instrument info
        existing_rows_with_packet_info = [
          ['VET', 'First Name', 'Last Name', 'Experience', 'Location', 'Email',
           'Status', 'Packet', 'Registered', 'Notes'],
          ['', 'John', 'Drummer', '', '', 'Test City, OH', 'john.drummer@example.com', '', '',
           'Front Ensemble Audition Packet downloaded. Some existing notes']
        ]

        described_class::ORIGINAL_TAB_NAMES.each do |tab_name|
          allow(mock_sheets_api).to receive(:read_sheet)
            .with('test-recruitment-id', tab_name)
            .and_return(existing_rows_with_packet_info.deep_dup)
        end

        allow(mock_sheets_api).to receive(:write_sheet) do |_sheet_id, tab_name, rows, _options|
          # Find the row for John Drummer (who has a packet)
          john_row = rows.find { |row| row[1] == 'John' && row[2] == 'Drummer' }
          next unless john_row

          # For multi-instrument tabs, should add instrument information even when packet info exists
          if described_class::TAB_INSTRUMENT_MAPPING[tab_name]&.size&.> 1
            expect(john_row[9]).to include('Marked instrument as Snare')
            # Should preserve existing notes and NOT add duplicate packet info since "packet" already exists
            expect(john_row[9]).to include('Some existing notes')
            expect(john_row[9]).to include('Front Ensemble Audition Packet downloaded')
            # Should not add duplicate packet info since it already exists
            expect(john_row[9]).not_to include('Battery Packet downloaded')
          end
        end

        service.call(profiles)
      end
    end

    context 'when recruitment spreadsheet is not configured' do
      before do
        allow(Auditions::Configuration).to receive(:recruitment_spreadsheet_id).and_return(nil)
      end

      it 'returns failure result' do
        result = service.call(profiles)

        expect(result).to be_failure
        expect(result.errors).to include('Recruitment spreadsheet ID not configured')
      end
    end

    context 'when sheet reading fails' do
      before do
        allow(mock_sheets_api).to receive(:read_sheet)
          .with('test-recruitment-id', 'MALLETS')
          .and_raise(StandardError, 'API Error')
      end

      it 'returns failure for the affected tab' do
        result = service.call(profiles)

        expect(result).to be_failure
        expect(result.errors.first).to include('Failed to read recruitment sheet tab: MALLETS')
      end
    end

    context 'when sheet writing fails' do
      before do
        allow(mock_sheets_api).to receive(:read_sheet).and_return(sample_existing_rows.deep_dup)
        allow(mock_sheets_api).to receive(:write_sheet)
          .with('test-recruitment-id', 'SD', anything, formulae: true)
          .and_raise(StandardError, 'Write Error')
      end

      it 'returns failure for the affected tab' do
        result = service.call(profiles)

        expect(result).to be_failure
        expect(result.errors.first).to include('Failed to write recruitment sheet SD: Write Error')
      end
    end
  end

  describe 'profile matching' do
    let(:existing_rows) do
      [
        ['', 'John', 'Smith', '', '', 'City, ST', 'john@example.com', '', '', '', ''],
        ['VET', 'Jane', 'Doe', '', '', 'City, ST', 'jane@example.com', '', '', '', '']
      ]
    end

    it 'matches profiles by first and last name (case insensitive)' do
      profile = Auditions::Profile.new(
        first_name: 'john',
        last_name: 'SMITH',
        email: 'different@example.com'
      )

      expect(service.send(:profile_exists_in_rows?, profile, existing_rows)).to be true
    end

    it 'does not match when names are different' do
      profile = Auditions::Profile.new(
        first_name: 'John',
        last_name: 'Johnson',
        email: 'john@example.com'
      )

      expect(service.send(:profile_exists_in_rows?, profile, existing_rows)).to be false
    end
  end

  describe 'row building' do
    let(:profile_with_packet) do
      with_test_auditions_year('2026') do
        Auditions::Profile.new(
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          packet: Auditions::Packet.new(
            date: DateTime.current,
            item: sample_packet_order['lineItems'].first,
            email: 'test@example.com'
          )
        )
      end
    end

    it 'builds row with correct structure' do
      row = Auditions::RecruitmentRowBuilder.build_row_for_unsorted(profile_with_packet, 'SD')

      expect(row[0]).to eq('') # Status column
      expect(row[1]).to eq('Test') # First name
      expect(row[2]).to eq('User') # Last name
      expect(row[5]).to eq('test@example.com') # Email
      expect(row[7]).to eq('Y') # Packet downloaded
    end

    it 'includes location information from packet' do
      row = Auditions::RecruitmentRowBuilder.build_row_for_unsorted(profile_with_packet, 'SD')
      expect(row[4]).to include('Columbus') # Location column (city from sample packet data)
    end
  end

  describe 'instrument handling' do
    it 'correctly identifies multi-instrument tabs' do
      expect(described_class::TAB_INSTRUMENT_MAPPING['MALLETS']).to contain_exactly(
        'Marimba', 'Vibraphone', 'Xylophone', 'Glockenspiel'
      )
      expect(described_class::TAB_INSTRUMENT_MAPPING['AUX']).to contain_exactly(
        'Drum Kit', 'Auxiliary Percussion'
      )
      expect(described_class::TAB_INSTRUMENT_MAPPING['ELECTRO']).to contain_exactly(
        'Synthesizer', 'Bass Guitar'
      )
    end

    it 'includes UNSORTED in tab names but not in original tabs' do
      expect(described_class::TAB_NAMES).to include('UNSORTED')
      expect(described_class::ORIGINAL_TAB_NAMES).not_to include('UNSORTED')
    end

    it 'includes instrument notes for multi-instrument tabs in UNSORTED' do
      with_test_auditions_year('2026') do
        # Create a profile with a marimba packet (multi-instrument MALLETS tab)
        marimba_profile = Auditions::Profile.new(
          first_name: 'Maria',
          last_name: 'Mallets',
          email: 'maria@example.com',
          packet: Auditions::Packet.new(
            date: DateTime.current,
            item: {
              'productName' => 'Cap City 2026 Front Ensemble Audition Packet',
              'customizations' => [
                { 'label' => 'Name', 'value' => 'Maria Mallets' },
                { 'label' => 'City', 'value' => 'Austin' },
                { 'label' => 'State', 'value' => 'TX' },
                { 'label' => 'Instrument', 'value' => 'Marimba' }
              ]
            },
            email: 'maria@example.com'
          )
        )

        row = Auditions::RecruitmentRowBuilder.build_row_for_unsorted(marimba_profile, 'MALLETS')

        # Should include instrument information in notes for multi-instrument tab
        expect(row[9]).to include('Marked instrument as Marimba')
      end
    end

    it 'does not include instrument notes for single-instrument tabs in UNSORTED' do
      with_test_auditions_year('2026') do
        # Create a profile with a snare packet (single-instrument SD tab)
        snare_profile = Auditions::Profile.new(
          first_name: 'Sam',
          last_name: 'Snare',
          email: 'sam@example.com',
          packet: Auditions::Packet.new(
            date: DateTime.current,
            item: sample_packet_order['lineItems'].first, # This has Snare instrument
            email: 'sam@example.com'
          )
        )

        row = Auditions::RecruitmentRowBuilder.build_row_for_unsorted(snare_profile, 'SD')

        # Should NOT include instrument information for single-instrument tab
        expect(row[9]).not_to include('Marked instrument as')
      end
    end
  end
end
