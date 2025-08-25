# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::RecruitmentRowBuilder do
  include AuditionsHelpers

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

  describe '.build_row_for_unsorted' do
    it 'builds row with correct structure' do
      row = described_class.build_row_for_unsorted(profile_with_packet, 'SD')

      expect(row[0]).to eq('') # Status column
      expect(row[1]).to eq('Test') # First name
      expect(row[2]).to eq('User') # Last name
      expect(row[5]).to eq('test@example.com') # Email
      expect(row[7]).to eq('Y') # Packet downloaded
    end

    it 'includes location information from packet' do
      row = described_class.build_row_for_unsorted(profile_with_packet, 'SD')
      expect(row[4]).to include('Columbus') # Location column (city from sample packet data)
    end

    it 'adds instrument notes for multi-instrument tabs' do
      row = described_class.build_row_for_unsorted(profile_with_packet, 'MALLETS')
      expect(row[9]).to include('Marked instrument as Snare') # Notes column should include instrument info
    end

    it 'does not add instrument notes for single-instrument tabs' do
      row = described_class.build_row_for_unsorted(profile_with_packet, 'SD')
      expect(row[9]).not_to include('Marked instrument as') # Should not include instrument info
    end
  end

  describe '.update_existing_rows_for_tab' do
    let(:existing_rows) do
      [
        ['', 'Test', 'User', '', '', 'City, ST', 'test@example.com', '', '', '', '']
      ]
    end

    let(:profiles) { [profile_with_packet] }

    it 'updates matching rows with packet information' do
      described_class.update_existing_rows_for_tab('SD', existing_rows, profiles)

      expect(existing_rows[0][7]).to eq('Y') # Packet downloaded flag
      expect(existing_rows[0][9]).to include('downloaded') # Notes should include packet info
    end

    it 'adds instrument notes for multi-instrument tabs' do
      described_class.update_existing_rows_for_tab('MALLETS', existing_rows, profiles)

      expect(existing_rows[0][9]).to include('Marked instrument as Snare')
    end
  end

  describe '.mark_packet_downloaded' do
    let(:row) { ['', 'Test', 'User', '', '', 'City, ST', 'test@example.com', '', '', '', ''] }

    it 'marks packet as downloaded' do
      described_class.mark_packet_downloaded(row, profile_with_packet, 'SD')

      expect(row[7]).to eq('Y')
      expect(row[9]).to include('downloaded')
    end

    it 'does not add duplicate packet info' do
      row[9] = 'Battery Packet downloaded. Some notes'

      described_class.mark_packet_downloaded(row, profile_with_packet, 'SD')

      expect(row[9]).not_to include('Battery Packet downloaded. Battery Packet downloaded')
    end
  end

  describe '.profile_matches_row?' do
    let(:profile) do
      Auditions::Profile.new(
        first_name: 'John',
        last_name: 'Smith',
        email: 'john@example.com'
      )
    end

    it 'matches profiles by first and last name (case insensitive)' do
      row = ['', 'john', 'SMITH', '', '', '', '', '', '', '', '']

      expect(described_class.profile_matches_row?(profile, row)).to be true
    end

    it 'does not match when names are different' do
      row = ['', 'John', 'Johnson', '', '', '', '', '', '', '', '']

      expect(described_class.profile_matches_row?(profile, row)).to be false
    end
  end

  describe '.person_row?' do
    it 'identifies VET rows as person rows' do
      row = ['VET', 'John', 'Smith', '', '', '', '', '', '', '', '']

      expect(described_class.person_row?(row)).to be true
    end

    it 'identifies regular person rows' do
      row = ['', 'John', 'Smith', '', '', '', '', '', '', '', '']

      expect(described_class.person_row?(row)).to be true
    end

    it 'does not identify empty rows as person rows' do
      row = ['', '', '', '', '', '', '', '', '', '', '']

      expect(described_class.person_row?(row)).to be false
    end
  end
end
