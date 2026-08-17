# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::AddressParser do
  describe '.parse' do
    it 'extracts city and state from a standard Squarespace address string' do
      address = '123 Main St, Columbus, OH 43215 US'

      result = described_class.parse(address)

      expect(result).to eq(city: 'Columbus', state: 'OH')
    end

    it 'handles a zip+4 code' do
      address = '6082 Sun Valley Drive, Grand Blanc, MI 48439-9166 US'

      result = described_class.parse(address)

      expect(result).to eq(city: 'Grand Blanc', state: 'MI')
    end

    it 'converts a full state name to its abbreviation' do
      address = '456 Oak Ave, Toledo, Ohio 43604'

      result = described_class.parse(address)

      expect(result).to eq(city: 'Toledo', state: 'OH')
    end

    it 'handles an address with no street segment' do
      address = 'Austin, TX 78701'

      result = described_class.parse(address)

      expect(result).to eq(city: 'Austin', state: 'TX')
    end

    it 'handles an address with no zip code' do
      address = '789 Elm St, Denver, CO'

      result = described_class.parse(address)

      expect(result).to eq(city: 'Denver', state: 'CO')
    end

    it 'handles an address with no country' do
      address = '2062 Shetland St, Marysville, OH 43040'

      result = described_class.parse(address)

      expect(result).to eq(city: 'Marysville', state: 'OH')
    end

    it 'returns blank city/state for a blank address' do
      expect(described_class.parse(nil)).to eq(city: '', state: '')
      expect(described_class.parse('')).to eq(city: '', state: '')
    end

    it 'returns blank city/state when there are not enough segments' do
      address = 'Somewhere Unparseable'

      result = described_class.parse(address)

      expect(result).to eq(city: '', state: '')
    end

    it 'titleizes multi-word city names' do
      address = '1 Main St, new york, NY 10001'

      result = described_class.parse(address)

      expect(result).to eq(city: 'New York', state: 'NY')
    end
  end
end
