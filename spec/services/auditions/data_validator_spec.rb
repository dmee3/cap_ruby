# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::DataValidator do
  include AuditionsHelpers

  describe '.validate_orders' do
    it 'returns success for valid orders' do
      orders = [sample_packet_order, sample_registration_order]
      result = described_class.validate_orders(orders)

      expect(result).to be_success
      expect(result.data).to eq(orders)
    end

    it 'returns failure for nil orders' do
      result = described_class.validate_orders(nil)

      expect(result).to be_failure
      expect(result).to have_error_containing('Orders data is nil')
    end

    it 'returns failure for non-array orders' do
      result = described_class.validate_orders('not an array')

      expect(result).to be_failure
      expect(result).to have_error_containing('Orders must be an array')
    end

    it 'returns success for empty orders array' do
      result = described_class.validate_orders([])

      expect(result).to be_success
    end

    it 'returns failure for orders with validation errors' do
      invalid_orders = [sample_invalid_order]
      result = described_class.validate_orders(invalid_orders)

      expect(result).to be_failure
      expect(result).to have_error_containing('missing customer email')
      expect(result).to have_error_containing('missing line items')
    end
  end

  describe '.validate_single_order' do
    it 'returns no errors for valid order' do
      errors = described_class.validate_single_order(sample_packet_order, 0)

      expect(errors).to be_empty
    end

    it 'validates customer email is present' do
      order = sample_packet_order.dup
      order['customerEmail'] = ''

      errors = described_class.validate_single_order(order, 0)

      expect(errors).to include('Order #1: missing customer email')
    end

    it 'validates line items are present' do
      order = sample_packet_order.dup
      order['lineItems'] = []

      errors = described_class.validate_single_order(order, 0)

      expect(errors).to include('Order #1: missing line items')
    end

    it 'validates line items is an array' do
      order = sample_packet_order.dup
      order['lineItems'] = 'not an array'

      errors = described_class.validate_single_order(order, 0)

      expect(errors).to include('Order #1: line items must be an array')
    end

    it 'validates created date is present' do
      order = sample_packet_order.dup
      order['createdOn'] = ''

      errors = described_class.validate_single_order(order, 0)

      expect(errors).to include('Order #1: missing created date')
    end

    it 'validates created date format' do
      order = sample_packet_order.dup
      order['createdOn'] = 'invalid date'

      errors = described_class.validate_single_order(order, 0)

      expect(errors).to include('Order #1: invalid created date format')
    end

    it 'validates each line item' do
      order = sample_packet_order.dup
      order['lineItems'] = [{ 'productName' => '' }]

      errors = described_class.validate_single_order(order, 0)

      expect(errors).to include('Order #1 item #1: missing product name')
    end
  end

  describe '.validate_line_item' do
    let(:valid_item) do
      {
        'productName' => 'Cap City 2026 Battery Audition Packet',
        'customizations' => [
          { 'label' => 'Name', 'value' => 'John Doe' }
        ]
      }
    end

    it 'returns no errors for valid configured product' do
      with_test_auditions_year('2026') do
        errors = described_class.validate_line_item(valid_item, 'Test item')

        expect(errors).to be_empty
      end
    end

    it 'returns no errors for unconfigured products' do
      item = valid_item.dup
      item['productName'] = 'Unknown Product'

      errors = described_class.validate_line_item(item, 'Test item')

      expect(errors).to be_empty
    end

    it 'validates product name is present' do
      item = valid_item.dup
      item['productName'] = ''

      errors = described_class.validate_line_item(item, 'Test item')

      expect(errors).to include('Test item: missing product name')
    end

    it 'validates customizations for configured products' do
      with_test_auditions_year('2026') do
        item = valid_item.dup
        item['customizations'] = []

        errors = described_class.validate_line_item(item, 'Test item')

        expect(errors).to include('Test item: missing customizations')
      end
    end

    it 'validates customizations is an array' do
      with_test_auditions_year('2026') do
        item = valid_item.dup
        item['customizations'] = 'not an array'

        errors = described_class.validate_line_item(item, 'Test item')

        expect(errors).to include('Test item: customizations must be an array')
      end
    end
  end

  describe '.configured_product?' do
    it 'returns true for configured packet products' do
      with_test_auditions_year('2026') do
        result = described_class.configured_product?('Cap City 2026 Battery Audition Packet')

        expect(result).to be true
      end
    end

    it 'returns true for configured registration products' do
      with_test_auditions_year('2026') do
        result = described_class.configured_product?('CC26 Music Ensemble Audition Registration')

        expect(result).to be true
      end
    end

    it 'returns false for unconfigured products' do
      with_test_auditions_year('2026') do
        result = described_class.configured_product?('Unknown Product')

        expect(result).to be false
      end
    end

    it 'returns false for blank product names' do
      result = described_class.configured_product?('')

      expect(result).to be false
    end

    it 'handles configuration errors gracefully' do
      with_test_auditions_year('1999') do
        result = described_class.configured_product?('Any Product')

        expect(result).to be false
      end
    end
  end

  describe '.validate_custom_fields' do
    let(:valid_fields) do
      [
        { 'label' => 'Name', 'value' => 'John Doe' },
        { 'label' => 'City', 'value' => 'Columbus' }
      ]
    end

    it 'returns success for valid fields with all required fields present' do
      result = described_class.validate_custom_fields(valid_fields, %w[Name City])

      expect(result).to be_success
      expect(result.data).to eq(valid_fields)
    end

    it 'returns failure for non-array custom fields' do
      result = described_class.validate_custom_fields('not an array', ['Name'])

      expect(result).to be_failure
      expect(result).to have_error_containing('must be an array')
    end

    it 'returns failure for missing required fields' do
      result = described_class.validate_custom_fields(valid_fields, %w[Name City State])

      expect(result).to be_failure
      expect(result).to have_error_containing("missing required field 'State'")
    end

    it 'validates individual field structure' do
      fields = [
        'not a hash',
        { 'label' => '', 'value' => 'test' },
        { 'label' => 'Test', 'value' => '' }
      ]

      result = described_class.validate_custom_fields(fields, [])

      expect(result).to be_failure
      expect(result).to have_error_containing('field #1: must be a hash')
      expect(result).to have_error_containing('field #2: missing label')
      expect(result).to have_error_containing('field #3 (Test): missing value')
    end
  end

  describe '.validate_profiles' do
    let(:mock_profile) do
      double('Profile', first_name: 'John', last_name: 'Doe', email: 'john@example.com')
    end

    it 'returns success for valid profiles' do
      profiles = [mock_profile]
      result = described_class.validate_profiles(profiles)

      expect(result).to be_success
      expect(result.data).to eq(profiles)
    end

    it 'returns failure for non-array profiles' do
      result = described_class.validate_profiles('not an array')

      expect(result).to be_failure
      expect(result).to have_error_containing('Profiles must be an array')
    end

    it 'returns success for empty profiles array' do
      result = described_class.validate_profiles([])

      expect(result).to be_success
    end

    it 'validates individual profile structure' do
      invalid_profile = double('Invalid Profile')
      allow(invalid_profile).to receive(:respond_to?).and_return(false)

      result = described_class.validate_profiles([invalid_profile])

      expect(result).to be_failure
      expect(result).to have_error_containing('missing required methods')
    end
  end

  describe '.validate_profile' do
    it 'returns no errors for valid profile' do
      profile = double('Profile',
                       first_name: 'John',
                       last_name: 'Doe',
                       email: 'john@example.com')
      allow(profile).to receive(:respond_to?).with(:first_name).and_return(true)
      allow(profile).to receive(:respond_to?).with(:last_name).and_return(true)
      allow(profile).to receive(:respond_to?).with(:email).and_return(true)

      errors = described_class.validate_profile(profile, 0)

      expect(errors).to be_empty
    end

    it 'validates required methods are present' do
      profile = double('Profile')
      allow(profile).to receive(:respond_to?).and_return(false)

      errors = described_class.validate_profile(profile, 0)

      expect(errors).to include('Profile #1: missing required methods (first_name, last_name, email)')
    end

    it 'validates required fields have values' do
      profile = double('Profile', first_name: '', last_name: nil, email: '  ')
      allow(profile).to receive(:respond_to?).with(:first_name).and_return(true)
      allow(profile).to receive(:respond_to?).with(:last_name).and_return(true)
      allow(profile).to receive(:respond_to?).with(:email).and_return(true)

      errors = described_class.validate_profile(profile, 0)

      expect(errors).to include('Profile #1: missing first name')
      expect(errors).to include('Profile #1: missing last name')
      expect(errors).to include('Profile #1: missing email')
    end
  end
end
