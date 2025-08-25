# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::Registration do
  include AuditionsHelpers

  let(:registration_item) do
    {
      'productName' => 'CC26 Music Ensemble Audition Registration',
      'customizations' => [
        { 'label' => 'First Name', 'value' => 'Jane' },
        { 'label' => 'Last Name', 'value' => 'Smith' },
        { 'label' => 'City', 'value' => 'Toledo' },
        { 'label' => 'State', 'value' => 'Ohio' },
        { 'label' => 'Primary Instrument', 'value' => 'Marimba' },
        { 'label' => 'Preferred Pronouns', 'value' => 'she/her' },
        { 'label' => 'Shoe Size', 'value' => '8' },
        { 'label' => 'Shirt Size', 'value' => 'M' },
        { 'label' => 'Birthdate', 'value' => '2000-05-15' },
        { 'label' => 'Experience', 'value' => '3 years high school' },
        { 'label' => 'Known Conflicts', 'value' => 'Work on weekends' }
      ]
    }
  end

  let(:date) { DateTime.parse('2025-09-01T15:30:00Z') }
  let(:email) { 'jane@example.com' }

  describe '.product_names' do
    it 'returns configured product names' do
      with_test_auditions_year('2026') do
        names = described_class.product_names

        expect(names).to include('CC26 Music Ensemble Audition Registration')
        expect(names).to include('CC26 Visual Ensemble Audition Registration')
      end
    end

    it 'falls back to constants when configuration fails' do
      with_test_auditions_year('1999') do
        names = described_class.product_names

        expect(names).to eq(described_class::PRODUCT_NAMES)
      end
    end
  end

  describe '.type_mapping' do
    it 'returns configured type mapping' do
      with_test_auditions_year('2026') do
        mapping = described_class.type_mapping

        expect(mapping['CC26 Music Ensemble Audition Registration']).to eq('Music Registration')
        expect(mapping['CC26 Visual Ensemble Audition Registration']).to eq('Visual Registration')
      end
    end

    it 'falls back to constants when configuration fails' do
      with_test_auditions_year('1999') do
        mapping = described_class.type_mapping

        expect(mapping).to eq(described_class::TYPE_MAP)
      end
    end
  end

  describe '.header_row' do
    it 'returns expected headers' do
      headers = described_class.header_row

      expected = ['First Name', 'Last Name', 'Email', 'City', 'State', 'Pronouns',
                  'Shoe', 'Shirt', 'Birthdate', 'Purchased', 'Experience', 'Conflicts']
      expect(headers).to eq(expected)
    end
  end

  describe '#initialize' do
    it 'creates registration with all fields' do
      with_test_auditions_year('2026') do
        registration = described_class.new(date: date, item: registration_item, email: email)

        expect(registration.type).to eq('Music Registration')
        expect(registration.email).to eq(email)
        expect(registration.date).to eq(date - 4.hours)
        expect(registration.first_name).to eq('Jane')
        expect(registration.last_name).to eq('Smith')
        expect(registration.city).to eq('Toledo')
        expect(registration.state).to eq('OH')
        expect(registration.instrument).to eq('Marimba')
        expect(registration.experience).to eq('3 years high school')
        expect(registration.birthdate).to eq('2000-05-15')
      end
    end

    it 'handles missing configuration gracefully' do
      with_test_auditions_year('1999') do
        registration = described_class.new(date: date, item: registration_item, email: email)

        expect(registration.first_name).to eq('Jane')
        expect(registration.last_name).to eq('Smith')
      end
    end

    it 'handles two-letter state codes' do
      with_test_auditions_year('2026') do
        item = registration_item.dup
        item['customizations'].find { |c| c['label'] == 'State' }['value'] = 'TX'

        registration = described_class.new(date: date, item: item, email: email)

        expect(registration.state).to eq('TX')
      end
    end

    it 'converts full state names to abbreviations' do
      with_test_auditions_year('2026') do
        # Mock StateConverterService
        allow(Auditions::StateConverterService).to receive(:abbreviation).with('Ohio').and_return('OH')

        registration = described_class.new(date: date, item: registration_item, email: email)

        expect(registration.state).to eq('OH')
      end
    end

    it 'handles missing optional fields' do
      with_test_auditions_year('2026') do
        item = registration_item.dup
        item['customizations'] = item['customizations'].select do |field|
          ['First Name', 'Last Name', 'City', 'State', 'Primary Instrument'].include?(field['label'])
        end

        registration = described_class.new(date: date, item: item, email: email)

        expect(registration.first_name).to eq('Jane')
        expect(registration.experience).to eq('')
        expect(registration.birthdate).to eq('')
      end
    end

    it 'handles invalid custom fields structure' do
      with_test_auditions_year('2026') do
        item = registration_item.dup
        item['customizations'] = [
          { 'label' => 'First Name' }, # missing value
          'invalid field' # not a hash
        ]

        registration = described_class.new(date: date, item: item, email: email)

        # Should fall back gracefully
        expect(registration.first_name).to be_a(String)
        expect(registration.last_name).to be_a(String)
      end
    end
  end

  describe '#to_row' do
    it 'returns formatted row data' do
      with_test_auditions_year('2026') do
        allow(Auditions::StateConverterService).to receive(:abbreviation).with('Ohio').and_return('OH')

        registration = described_class.new(date: date, item: registration_item, email: email)
        row = registration.to_row

        expect(row).to eq([
                            'Jane',
                            'Smith',
                            'jane@example.com',
                            'Toledo',
                            'OH',
                            'she/her',
                            '8',
                            'M',
                            '2000-05-15',
                            '9/1 11:30 am', # date - 4 hours formatted
                            '3 years high school',
                            'Work on weekends'
                          ])
      end
    end
  end

  describe 'field parsing methods' do
    describe '#find_field_value' do
      let(:custom_fields) do
        [
          { 'label' => 'Test Field', 'value' => 'test value' },
          { 'label' => 'Empty Field', 'value' => '' },
          { 'label' => 'Missing Value' }
        ]
      end

      it 'returns value for existing field' do
        registration = described_class.new(date: date, item: registration_item, email: email)
        value = registration.send(:find_field_value, custom_fields, 'Test Field')

        expect(value).to eq('test value')
      end

      it 'returns empty string for missing field' do
        registration = described_class.new(date: date, item: registration_item, email: email)
        value = registration.send(:find_field_value, custom_fields, 'Nonexistent Field')

        expect(value).to eq('')
      end

      it 'returns empty string for field without value' do
        registration = described_class.new(date: date, item: registration_item, email: email)
        value = registration.send(:find_field_value, custom_fields, 'Missing Value')

        expect(value).to eq('')
      end
    end

    describe 'state parsing' do
      it 'handles state conversion errors' do
        with_test_auditions_year('2026') do
          item = registration_item.dup
          item['customizations'].find { |c| c['label'] == 'State' }['value'] = 'Invalid State'

          allow(Auditions::StateConverterService).to receive(:abbreviation).and_raise(
            StandardError, 'Invalid state'
          )

          registration = described_class.new(date: date, item: item, email: email)

          expect(registration.state).to eq('Invalid State') # Falls back to original value
        end
      end

      it 'handles empty state value' do
        with_test_auditions_year('2026') do
          item = registration_item.dup
          item['customizations'].find { |c| c['label'] == 'State' }['value'] = ''

          registration = described_class.new(date: date, item: item, email: email)

          expect(registration.state).to eq('')
        end
      end
    end
  end

  describe 'error handling and fallbacks' do
    it 'uses fallback parsing when configuration validation fails' do
      with_test_auditions_year('2026') do
        # Mock validation failure
        allow(Auditions::DataValidator).to receive(:validate_custom_fields).and_return(
          Auditions::Result.failure(['validation error'])
        )

        registration = described_class.new(date: date, item: registration_item, email: email)

        # Should still parse using fallback
        expect(registration.first_name).to eq('Jane')
        expect(registration.last_name).to eq('Smith')
      end
    end

    it 'handles configuration loading errors' do
      with_test_auditions_year('2026') do
        allow(Auditions::Configuration).to receive(:registration_field_mappings).and_raise(
          StandardError, 'Config error'
        )

        registration = described_class.new(date: date, item: registration_item, email: email)

        # Should use fallback parsing
        expect(registration.first_name).to eq('Jane')
        expect(registration.last_name).to eq('Smith')
      end
    end

    it 'handles completely invalid custom fields' do
      with_test_auditions_year('2026') do
        item = registration_item.dup
        item['customizations'] = 'not an array'

        registration = described_class.new(date: date, item: item, email: email)

        # Should not raise error, use empty defaults
        expect(registration.first_name).to be_a(String)
        expect(registration.last_name).to be_a(String)
      end
    end
  end
end
