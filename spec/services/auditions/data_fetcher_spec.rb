# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::DataFetcher do
  include AuditionsHelpers

  let(:service) { described_class.new }

  describe '#call' do
    it 'successfully fetches and validates orders' do
      mock_squarespace_api_with_success

      result = service.call

      expect(result).to be_success
      expect(result.data.size).to eq(2)
    end

    it 'handles API timeout errors' do
      mock_squarespace_api_with_failure(Faraday::TimeoutError)

      result = service.call

      expect(result).to be_failure
      expect(result).to have_error_containing('Connection timeout')
    end

    it 'handles API connection errors' do
      mock_squarespace_api_with_failure(Faraday::ConnectionFailed)

      result = service.call

      expect(result).to be_failure
      expect(result).to have_error_containing('Failed to connect')
    end

    it 'excludes orders with a canceled fulfillment status' do
      mock_squarespace_api_with_success(sample_orders + [sample_canceled_registration_order])

      result = service.call

      expect(result).to be_success
      expect(result.data.size).to eq(2)
      expect(result.data.map { |order| order['customerEmail'] })
        .not_to include('canceled.user@example.com')
    end

    it 'keeps a non-canceled order from a customer who also has a canceled one' do
      canceled = sample_canceled_registration_order
      kept = sample_packet_order.merge('customerEmail' => canceled['customerEmail'])
      mock_squarespace_api_with_success([canceled, kept])

      result = service.call

      expect(result).to be_success
      expect(result.data).to eq([kept])
    end

    it 'does not fail validation on a canceled order that is malformed' do
      canceled = sample_invalid_order.merge('fulfillmentStatus' => 'CANCELED')
      mock_squarespace_api_with_success(sample_orders + [canceled])

      result = service.call

      expect(result).to be_success
      expect(result.data.size).to eq(2)
    end

    it 'handles validation failures' do
      invalid_orders = [sample_invalid_order]
      mock_squarespace_api_with_success(invalid_orders)

      result = service.call

      expect(result).to be_failure
      expect(result).to have_error_containing('missing customer email')
    end
  end
end
