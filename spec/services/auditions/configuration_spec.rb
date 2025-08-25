# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::Configuration do
  include AuditionsHelpers

  describe '.current_year' do
    it 'returns current year by default' do
      # Ensure no environment override
      old_year = ENV.fetch('AUDITIONS_YEAR', nil)
      ENV.delete('AUDITIONS_YEAR')
      described_class.reset!

      expect(described_class.current_year).to eq(Date.current.year.to_s)
    ensure
      ENV['AUDITIONS_YEAR'] = old_year if old_year
      described_class.reset!
    end

    it 'returns AUDITIONS_YEAR environment variable when set' do
      with_test_auditions_year('2027') do
        expect(described_class.current_year).to eq('2027')
      end
    end
  end

  describe '.config_data' do
    it 'loads configuration from YAML file' do
      with_test_auditions_year('2026') do
        config = described_class.config_data
        expect(config).to be_a(Hash)
        expect(config['date_range']).to be_present
        expect(config['products']).to be_present
      end
    end

    it 'raises error for missing configuration file' do
      with_test_auditions_year('1999') do
        expect { described_class.config_data }.to raise_error(/configuration file not found/)
      end
    end

    it 'caches configuration data' do
      with_test_auditions_year('2026') do
        expect(YAML).to receive(:load_file).once.and_call_original

        # First call loads from file
        described_class.config_data
        # Second call uses cache
        described_class.config_data
      end
    end
  end

  describe '.date_range' do
    it 'returns start and end dates from configuration' do
      with_test_auditions_year('2026') do
        range = described_class.date_range

        expect(range[:start_date]).to eq('2025-08-14T12:00:00Z')
        expect(range[:end_date]).to eq('2025-11-01T12:30:00Z')
      end
    end
  end

  describe '.packet_product_names' do
    it 'returns array of packet product names' do
      with_test_auditions_year('2026') do
        names = described_class.packet_product_names

        expect(names).to be_an(Array)
        expect(names).to include('Cap City 2026 Battery Audition Packet')
        expect(names).to include('Cap City 2026 Front Ensemble Audition Packet')
      end
    end
  end

  describe '.registration_product_names' do
    it 'returns array of registration product names' do
      with_test_auditions_year('2026') do
        names = described_class.registration_product_names

        expect(names).to be_an(Array)
        expect(names).to include('CC26 Music Ensemble Audition Registration')
        expect(names).to include('CC26 Visual Ensemble Audition Registration')
      end
    end
  end

  describe '.packet_type_mapping' do
    it 'returns hash mapping product names to display names' do
      with_test_auditions_year('2026') do
        mapping = described_class.packet_type_mapping

        expect(mapping).to be_a(Hash)
        expect(mapping['Cap City 2026 Battery Audition Packet']).to eq('Battery Packet')
      end
    end
  end

  describe '.field_mappings' do
    it 'returns field mappings for packet and registration' do
      with_test_auditions_year('2026') do
        mappings = described_class.field_mappings

        expect(mappings['packet']).to be_present
        expect(mappings['registration']).to be_present
        expect(mappings['packet']['name_field']).to eq('Name')
        expect(mappings['registration']['first_name_field']).to eq('First Name')
      end
    end
  end

  describe '.reset!' do
    it 'clears all cached data' do
      with_test_auditions_year('2026') do
        # Load some data to cache it
        described_class.config_data
        described_class.date_range

        # Reset should clear cache
        described_class.reset!

        # Next call should reload from file
        expect(YAML).to receive(:load_file).and_call_original
        described_class.config_data
      end
    end
  end

  describe 'error handling' do
    it 'handles invalid YAML gracefully' do
      with_test_auditions_year('2026') do
        # Mock invalid YAML
        allow(YAML).to receive(:load_file).and_raise(Psych::SyntaxError.new('', 1, 1, 1,
                                                                            'test error', ''))

        expect do
          described_class.config_data
        end.to raise_error(/Invalid auditions configuration file/)
      end
    end
  end
end
