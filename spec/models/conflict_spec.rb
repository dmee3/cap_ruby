require 'rails_helper'

RSpec.describe Conflict, type: :model do
  context 'validations' do
    subject { Conflict.new }

    it 'requires an end_date' do
      expect(subject).not_to be_valid
    end
  end
end
