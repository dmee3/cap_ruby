require 'rails_helper'

RSpec.describe Payment, type: :model do
  context 'validations' do
    subject { build(:payment) }

    it { is_expected.to be_valid }

    it 'requires an amount' do
      subject.amount = nil
      expect(subject).to_not be_valid
    end

    it 'requires a date paid' do
      subject.date_paid = nil
      expect(subject).to_not be_valid
    end

    it 'requires a payment type' do
      subject.payment_type_id = nil
      expect(subject).to_not be_valid
    end

    it 'requires a season' do
      subject.season_id = nil
      expect(subject).to_not be_valid
    end

    it 'requires a user' do
      subject.user_id = nil
      expect(subject).to_not be_valid
    end
  end
end
