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

    it 'handles validation failures' do
      invalid_orders = [sample_invalid_order]
      mock_squarespace_api_with_success(invalid_orders)

      result = service.call

      expect(result).to be_failure
      expect(result).to have_error_containing('missing customer email')
    end
  end
end
