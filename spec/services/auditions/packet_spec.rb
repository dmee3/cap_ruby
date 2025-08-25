# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::Packet do
  include AuditionsHelpers

  let(:packet_item) do
    {
      'productName' => 'Cap City 2026 Battery Audition Packet',
      'customizations' => [
        { 'label' => 'Name', 'value' => 'John Doe' },
        { 'label' => 'City', 'value' => 'Columbus' },
        { 'label' => 'State', 'value' => 'OH' },
        { 'label' => 'Instrument', 'value' => 'Snare' }
      ]
    }
  end

  let(:date) { DateTime.parse('2025-09-01T12:00:00Z') }
  let(:email) { 'test@example.com' }

  describe '.product_names' do
    it 'returns configured product names' do
      with_test_auditions_year('2026') do
        names = described_class.product_names

        expect(names).to include('Cap City 2026 Battery Audition Packet')
        expect(names).to include('Cap City 2026 Front Ensemble Audition Packet')
      end
    end

    it 'falls back to constants when configuration fails' do
      with_test_auditions_year('1999') do
        names = described_class.product_names

        expect(names).to eq(described_class::PRODUCT_NAMES)
      end
    end
  end

  describe '.header_row' do
    it 'returns expected headers' do
      headers = described_class.header_row

      expect(headers).to eq(['First Name', 'Last Name', 'Email', 'City', 'State', 'Downloaded'])
    end
  end

  describe '#initialize' do
    it 'creates packet with basic information' do
      with_test_auditions_year('2026') do
        packet = described_class.new(date: date, item: packet_item, email: email)

        expect(packet.type).to eq('Cap City 2026 Battery Audition Packet')
        expect(packet.email).to eq(email)
        expect(packet.date).to eq(date - 4.hours)
        expect(packet.first_name).to eq('John')
        expect(packet.last_name).to eq('Doe')
        expect(packet.city).to eq('Columbus')
        expect(packet.state).to eq('OH')
        expect(packet.instrument).to eq('Snare')
      end
    end

    it 'handles missing configuration gracefully' do
      with_test_auditions_year('1999') do
        packet = described_class.new(date: date, item: packet_item, email: email)

        expect(packet.first_name).to eq('John')
        expect(packet.last_name).to eq('Doe')
      end
    end

    it 'handles complex names' do
      with_test_auditions_year('2026') do
        item = packet_item.dup
        item['customizations'].find do |c|
          c['label'] == 'Name'
        end['value'] = 'Mary Jane Watson-Parker'

        packet = described_class.new(date: date, item: item, email: email)

        expect(packet.first_name).to eq('Mary')
        expect(packet.last_name).to eq('Jane Watson-Parker')
      end
    end

    it 'handles full state names' do
      with_test_auditions_year('2026') do
        item = packet_item.dup
        item['customizations'].find { |c| c['label'] == 'State' }['value'] = 'Ohio'

        # Mock StateConverterService
        allow(Auditions::StateConverterService).to receive(:abbreviation).with('Ohio').and_return('OH')

        packet = described_class.new(date: date, item: item, email: email)

        expect(packet.state).to eq('OH')
      end
    end

    it 'handles missing custom fields gracefully' do
      with_test_auditions_year('2026') do
        item = packet_item.dup
        item['customizations'] = []

        packet = described_class.new(date: date, item: item, email: email)

        expect(packet.first_name).to eq('')
        expect(packet.last_name).to eq('')
        expect(packet.city).to eq('')
        expect(packet.state).to eq('')
        expect(packet.instrument).to eq('')
      end
    end

    it 'handles invalid custom fields structure' do
      with_test_auditions_year('2026') do
        item = packet_item.dup
        item['customizations'] = [
          { 'label' => 'Name' }, # missing value
          'invalid field' # not a hash
        ]

        packet = described_class.new(date: date, item: item, email: email)

        # Should fall back gracefully
        expect(packet.first_name).to be_a(String)
        expect(packet.last_name).to be_a(String)
      end
    end
  end

  describe '#to_row' do
    it 'returns formatted row data' do
      with_test_auditions_year('2026') do
        packet = described_class.new(date: date, item: packet_item, email: email)
        row = packet.to_row

        expect(row).to eq([
                            'John',
                            'Doe',
                            'test@example.com',
                            'Columbus',
                            'OH',
                            '9/1 8:00 am' # date - 4 hours formatted
                          ])
      end
    end
  end

  describe 'field parsing' do
    describe 'name parsing' do
      it 'handles single name' do
        with_test_auditions_year('2026') do
          item = packet_item.dup
          item['customizations'].find { |c| c['label'] == 'Name' }['value'] = 'Cher'

          packet = described_class.new(date: date, item: item, email: email)

          expect(packet.first_name).to eq('Cher')
          expect(packet.last_name).to eq('')
        end
      end

      it 'handles empty name' do
        with_test_auditions_year('2026') do
          item = packet_item.dup
          item['customizations'].find { |c| c['label'] == 'Name' }['value'] = ''

          packet = described_class.new(date: date, item: item, email: email)

          expect(packet.first_name).to eq('')
          expect(packet.last_name).to eq('')
        end
      end
    end

    describe 'state parsing' do
      it 'handles two-letter state codes' do
        with_test_auditions_year('2026') do
          item = packet_item.dup
          item['customizations'].find { |c| c['label'] == 'State' }['value'] = 'CA'

          packet = described_class.new(date: date, item: item, email: email)

          expect(packet.state).to eq('CA')
        end
      end

      it 'converts full state names to abbreviations' do
        with_test_auditions_year('2026') do
          item = packet_item.dup
          item['customizations'].find { |c| c['label'] == 'State' }['value'] = 'California'

          allow(Auditions::StateConverterService).to receive(:abbreviation).with('California').and_return('CA')

          packet = described_class.new(date: date, item: item, email: email)

          expect(packet.state).to eq('CA')
        end
      end

      it 'handles state conversion errors' do
        with_test_auditions_year('2026') do
          item = packet_item.dup
          item['customizations'].find { |c| c['label'] == 'State' }['value'] = 'Invalid State'

          allow(Auditions::StateConverterService).to receive(:abbreviation).and_raise(
            StandardError, 'Invalid state'
          )

          packet = described_class.new(date: date, item: item, email: email)

          expect(packet.state).to eq('Invalid State') # Falls back to original value
        end
      end
    end
  end

  describe 'error handling and fallbacks' do
    it 'uses fallback parsing when configuration validation fails' do
      with_test_auditions_year('2026') do
        item = packet_item.dup

        # Mock validation failure
        allow(Auditions::DataValidator).to receive(:validate_custom_fields).and_return(
          Auditions::Result.failure(['validation error'])
        )

        packet = described_class.new(date: date, item: item, email: email)

        # Should still parse using fallback
        expect(packet.first_name).to eq('John')
        expect(packet.last_name).to eq('Doe')
      end
    end

    it 'handles completely invalid custom fields' do
      with_test_auditions_year('2026') do
        item = packet_item.dup
        item['customizations'] = 'not an array'

        packet = described_class.new(date: date, item: item, email: email)

        # Should not raise error, use empty defaults
        expect(packet.first_name).to be_a(String)
        expect(packet.last_name).to be_a(String)
      end
    end
  end
end
