# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AuditionCheckIn::Person do
  def person(birthday)
    described_class.new(first_name: 'Sam', last_name: 'Reed', email: 'sam@example.com', selfie: '', birthday: birthday)
  end

  describe '#age' do
    let(:audition_day) { Date.new(2026, 10, 3) }

    it 'counts a birthday on the day itself' do
      expect(person('10/3/2009').age(on: audition_day)).to eq(17)
    end

    it 'does not count a birthday later in the year' do
      expect(person('10/4/2009').age(on: audition_day)).to eq(16)
    end

    it 'reads the Registrations tab dates month-first' do
      # Read day-first, this would be 5 January and make them a year older in spring
      expect(person('5/1/2009').age(on: Date.new(2026, 3, 1))).to eq(16)
    end

    it 'handles ISO dates' do
      expect(person('2009-05-01').age(on: audition_day)).to eq(17)
    end

    it 'gives no age for a birthday it cannot read, rather than a wrong one' do
      expect(person('sometime in 2009').age(on: audition_day)).to be_nil
      expect(person('').age(on: audition_day)).to be_nil
      expect(person('5/1/09').age(on: audition_day)).to be_nil
    end
  end

  it 'takes the Drive file id from a Google Forms upload link' do
    upload = described_class.new(first_name: 'Sam', last_name: 'Reed', email: 'sam@example.com',
                                 selfie: 'https://drive.google.com/open?id=1AbC-xyz_9')

    expect(upload.selfie_file_id).to eq('1AbC-xyz_9')
  end
end
