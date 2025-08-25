# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::ProfileBuilder do
  include AuditionsHelpers

  let(:service) { described_class.new }
  let(:orders) { [sample_packet_order, sample_registration_order] }

  describe '#call' do
    it 'successfully builds profiles from orders' do
      with_test_auditions_year('2026') do
        result = service.call(orders)

        expect(result).to be_success
        expect(result.data[:profiles].size).to eq(2)
        expect(result.data[:registrations].size).to eq(1)
        expect(result.data[:packets].size).to eq(1)
      end
    end

    it 'handles orders with invalid dates gracefully' do
      with_test_auditions_year('2026') do
        invalid_order = sample_packet_order.dup
        invalid_order['createdOn'] = 'invalid date'

        result = service.call([invalid_order])

        expect(result).to be_success
        expect(result.data[:profiles]).to be_empty
      end
    end

    it 'merges profiles with matching emails' do
      with_test_auditions_year('2026') do
        # Create orders with same email
        packet_order = sample_packet_order.dup
        registration_order = sample_registration_order.dup
        packet_order['customerEmail'] = 'same@example.com'
        registration_order['customerEmail'] = 'same@example.com'

        result = service.call([packet_order, registration_order])

        expect(result).to be_success
        expect(result.data[:profiles].size).to eq(1) # Should merge
        expect(result.data[:profiles].first.email).to eq('same@example.com')
      end
    end

    it 'handles profile validation failures' do
      with_test_auditions_year('2026') do
        # Mock DataValidator to fail validation
        allow(Auditions::DataValidator).to receive(:validate_profiles)
          .and_return(Auditions::Result.failure(['Profile validation failed']))

        result = service.call(orders)

        expect(result).to be_failure
        expect(result).to have_error_containing('Profile validation failed')
      end
    end
  end
end
