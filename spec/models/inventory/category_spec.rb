# frozen_string_literal: true

# == Schema Information
#
# Table name: inventory_categories
#
#  id         :integer          not null, primary key
#  name       :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
require 'rails_helper'

RSpec.describe Inventory::Category, type: :model do
  context 'validations' do
    subject { create(:inventory_category) }

    it { is_expected.to be_valid }

    it 'requires a name' do
      subject.name = nil
      expect(subject).to_not be_valid
    end

    it 'requires a non-empty name' do
      subject.name = ''
      expect(subject).to_not be_valid
    end
  end

  context 'associations' do
    it 'has many items' do
      expect(subject).to respond_to(:items)
    end
  end
end
