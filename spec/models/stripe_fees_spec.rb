# frozen_string_literal: true

require 'rails_helper'

RSpec.describe StripeFees do
  describe '.total_cents' do
    it 'grosses the fee up on top of the dues amount' do
      # 12000 / 0.97 + 30 = 12401.03... -> 12401
      expect(described_class.total_cents(12_000)).to eq(12_401)
    end

    it 'rounds rather than truncates (the old bug lost a cent)' do
      # 12401 / 0.97 = 12784.5... ; +30 = 12814.5... -> 12815 (round), not 12814 (trunc)
      expect(described_class.total_cents(12_401)).to eq(12_815)
    end

    it 'returns the flat fee for a zero amount' do
      expect(described_class.total_cents(0)).to eq(30)
    end
  end

  describe '.fee_cents' do
    it 'is the difference between the total and the amount' do
      expect(described_class.fee_cents(12_000)).to eq(described_class.total_cents(12_000) - 12_000)
      expect(described_class.fee_cents(12_000)).to eq(401)
    end
  end
end
