# frozen_string_literal: true

require 'rails_helper'

# The server twin of utilities/ordinals.ts. The two have to agree, because a
# donor sees the picker build this phrase in React and then the confirmation
# render it in ERB on the very next screen.
RSpec.describe Fundraiser::DateList do
  describe '.ordinal' do
    it 'handles the three irregular suffixes' do
      expect(described_class.ordinal(1)).to eq('1st')
      expect(described_class.ordinal(2)).to eq('2nd')
      expect(described_class.ordinal(3)).to eq('3rd')
    end

    it 'handles the teens, which a last-digit rule gets wrong' do
      expect(described_class.ordinal(11)).to eq('11th')
      expect(described_class.ordinal(12)).to eq('12th')
      expect(described_class.ordinal(13)).to eq('13th')
    end

    it 'handles the twenties, where the suffixes come back' do
      expect(described_class.ordinal(21)).to eq('21st')
      expect(described_class.ordinal(22)).to eq('22nd')
      expect(described_class.ordinal(23)).to eq('23rd')
    end

    it 'covers every sponsorable date' do
      all = (1..Fundraiser::TOTAL_DATES).map { |n| described_class.ordinal(n) }

      expect(all.first).to eq('1st')
      expect(all.last).to eq('31st')
      expect(all).to all(match(/\A\d+(st|nd|rd|th)\z/))
    end
  end

  describe '.call' do
    it 'is empty for no dates' do
      expect(described_class.call([])).to eq('')
    end

    it 'reads a single date plainly' do
      expect(described_class.call([9])).to eq('the 9th')
    end

    it 'joins two with and' do
      expect(described_class.call([3, 12])).to eq('the 3rd and 12th')
    end

    it 'joins three the way someone would say it' do
      expect(described_class.call([3, 12, 17])).to eq('the 3rd, 12th and 17th')
    end

    it 'sorts, so the order the donor tapped does not change the sentence' do
      expect(described_class.call([17, 3, 12])).to eq('the 3rd, 12th and 17th')
    end
  end
end
