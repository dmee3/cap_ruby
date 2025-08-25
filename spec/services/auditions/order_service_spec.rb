# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::OrderService do
  include AuditionsHelpers

  describe '.fetch_items' do
    it 'returns instance method result' do
      service_instance = instance_double(described_class)
      allow(described_class).to receive(:new).and_return(service_instance)
      allow(service_instance).to receive(:fetch_items).and_return(Auditions::Result.success('test'))

      result = described_class.fetch_items

      expect(result.data).to eq('test')
    end
  end

  describe '#fetch_items' do
    let(:service) { described_class.new }

    context 'with successful API response' do
      before do
        mock_squarespace_api_with_success
      end

      it 'returns success result with parsed data' do
        with_test_auditions_year('2026') do
          result = service.fetch_items

          expect(result).to be_success
          expect(result.data[:registrations]).to be_an(Array)
          expect(result.data[:packets]).to be_an(Array)
          expect(result.data[:registrations].size).to eq(1)
          expect(result.data[:packets].size).to eq(1)
        end
      end

      it 'creates packet objects correctly' do
        with_test_auditions_year('2026') do
          result = service.fetch_items
          packet = result.data[:packets].first

          expect(packet).to be_a(Auditions::Packet)
          expect(packet.first_name).to eq('John')
          expect(packet.last_name).to eq('Doe')
          expect(packet.email).to eq('packet.user@example.com')
        end
      end

      it 'creates registration objects correctly' do
        with_test_auditions_year('2026') do
          result = service.fetch_items
          registration = result.data[:registrations].first

          expect(registration).to be_a(Auditions::Registration)
          expect(registration.first_name).to eq('Jane')
          expect(registration.last_name).to eq('Smith')
          expect(registration.email).to eq('registration.user@example.com')
        end
      end

      it 'handles empty orders array' do
        mock_squarespace_api_with_success([])

        result = service.fetch_items

        expect(result).to be_success
        expect(result.data[:registrations]).to be_empty
        expect(result.data[:packets]).to be_empty
      end

      it 'skips unknown products' do
        with_test_auditions_year('2026') do
          unknown_order = {
            'customerEmail' => 'test@example.com',
            'createdOn' => '2025-09-01T12:00:00Z',
            'lineItems' => [
              {
                'productName' => 'Unknown Product',
                'customizations' => []
              }
            ]
          }

          mock_squarespace_api_with_success([unknown_order])

          result = service.fetch_items

          expect(result).to be_success
          expect(result.data[:registrations]).to be_empty
          expect(result.data[:packets]).to be_empty
        end
      end
    end

    context 'with API failures' do
      it 'handles rate limiting' do
        mock_squarespace_api_with_failure(External::ApiErrors::TooManyRequests)

        result = service.fetch_items

        expect(result).to be_failure
        expect(result).to have_error_containing('Rate limited')
      end

      it 'handles timeout errors' do
        mock_squarespace_api_with_failure(Faraday::TimeoutError)

        result = service.fetch_items

        expect(result).to be_failure
        expect(result).to have_error_containing('timeout')
      end

      it 'handles connection failures' do
        mock_squarespace_api_with_failure(Faraday::ConnectionFailed)

        result = service.fetch_items

        expect(result).to be_failure
        expect(result).to have_error_containing('Failed to connect')
      end

      it 'handles JSON parsing errors' do
        mock_squarespace_api_with_failure(JSON::ParserError)

        result = service.fetch_items

        expect(result).to be_failure
        expect(result).to have_error_containing('invalid response')
      end

      it 'handles unexpected errors' do
        mock_squarespace_api_with_failure(StandardError)

        result = service.fetch_items

        expect(result).to be_failure
        expect(result).to have_error_containing('Unexpected error')
      end
    end

    context 'with invalid data' do
      it 'handles data validation failures' do
        invalid_orders = [sample_invalid_order]
        mock_squarespace_api_with_success(invalid_orders)

        result = service.fetch_items

        expect(result).to be_failure
        expect(result).to have_error_containing('missing customer email')
      end

      it 'handles orders with invalid dates' do
        with_test_auditions_year('2026') do
          order = sample_packet_order.dup
          order['createdOn'] = 'invalid date'

          mock_squarespace_api_with_success([order])

          result = service.fetch_items

          # Should fail validation due to invalid date format
          expect(result).to be_failure
          expect(result).to have_error_containing('invalid created date format')
        end
      end

      it 'handles individual item creation failures' do
        with_test_auditions_year('2026') do
          # Mock Packet.new to fail
          allow(Auditions::Packet).to receive(:new).and_raise(StandardError,
                                                              'Packet creation failed')

          result = service.fetch_items

          # Should succeed but have empty packets
          expect(result).to be_success
          expect(result.data[:packets]).to be_empty
        end
      end
    end
  end

  describe 'private methods' do
    let(:service) { described_class.new }

    describe '#packet?' do
      it 'returns true for configured packet products' do
        with_test_auditions_year('2026') do
          result = service.send(:packet?, 'Cap City 2026 Battery Audition Packet')

          expect(result).to be true
        end
      end

      it 'returns false for non-packet products' do
        with_test_auditions_year('2026') do
          result = service.send(:packet?, 'CC26 Music Ensemble Audition Registration')

          expect(result).to be false
        end
      end
    end

    describe '#registration?' do
      it 'returns true for configured registration products' do
        with_test_auditions_year('2026') do
          result = service.send(:registration?, 'CC26 Music Ensemble Audition Registration')

          expect(result).to be true
        end
      end

      it 'returns false for non-registration products' do
        with_test_auditions_year('2026') do
          result = service.send(:registration?, 'Cap City 2026 Battery Audition Packet')

          expect(result).to be false
        end
      end
    end

    describe '#process_order' do
      it 'processes valid order successfully' do
        with_test_auditions_year('2026') do
          service.send(:process_order, sample_packet_order, 1)

          # Check that packet was added (accessing instance variables for testing)
          packets = service.instance_variable_get(:@packets)
          expect(packets.size).to eq(1)
          expect(packets.first.email).to eq('packet.user@example.com')
        end
      end

      it 'handles orders with invalid dates gracefully' do
        with_test_auditions_year('2026') do
          order = sample_packet_order.dup
          order['createdOn'] = 'invalid date'

          # Should not raise error
          expect do
            service.send(:process_order, order, 1)
          end.not_to raise_error

          # Should not add any items
          packets = service.instance_variable_get(:@packets)
          expect(packets).to be_empty
        end
      end
    end

    describe '#process_line_item' do
      it 'adds packet for packet products' do
        with_test_auditions_year('2026') do
          item = sample_packet_order['lineItems'].first
          date = DateTime.parse(sample_packet_order['createdOn'])

          service.send(:process_line_item, item, date, 'test@example.com', 1, 1)

          packets = service.instance_variable_get(:@packets)
          expect(packets.size).to eq(1)
        end
      end

      it 'adds registration for registration products' do
        with_test_auditions_year('2026') do
          item = sample_registration_order['lineItems'].first
          date = DateTime.parse(sample_registration_order['createdOn'])

          service.send(:process_line_item, item, date, 'test@example.com', 1, 1)

          registrations = service.instance_variable_get(:@registrations)
          expect(registrations.size).to eq(1)
        end
      end

      it 'skips unknown products without error' do
        with_test_auditions_year('2026') do
          item = { 'productName' => 'Unknown Product', 'customizations' => [] }
          date = DateTime.current

          expect do
            service.send(:process_line_item, item, date, 'test@example.com', 1, 1)
          end.not_to raise_error

          packets = service.instance_variable_get(:@packets)
          registrations = service.instance_variable_get(:@registrations)
          expect(packets).to be_empty
          expect(registrations).to be_empty
        end
      end
    end

    describe 'error recovery' do
      it 'continues processing after individual item failures' do
        with_test_auditions_year('2026') do
          orders = [sample_packet_order, sample_registration_order]
          mock_squarespace_api_with_success(orders)

          # Mock first item creation to fail
          call_count = 0
          allow(Auditions::Packet).to receive(:new) do
            call_count += 1
            raise StandardError, 'First item failed' if call_count == 1

            # Let normal creation proceed
            Auditions::Packet.new(date: DateTime.current,
                                  item: sample_packet_order['lineItems'].first,
                                  email: 'test@example.com')
          end

          result = service.fetch_items

          expect(result).to be_success
          # Should have registration despite packet failure
          expect(result.data[:registrations].size).to eq(1)
        end
      end
    end
  end
end
