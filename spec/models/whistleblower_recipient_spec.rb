# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Whistleblower recipients', type: :model do
  describe '.whistleblower_recipients' do
    it 'is the flagged users, not a role and not a season' do
      flagged = create(:user, first_name: 'Ada', whistleblower_recipient: true)
      season = create(:season, year: Date.today.year)
      admin_without_flag = create(:user, first_name: 'Grace')
      create(:seasons_user, user: admin_without_flag, season: season, role: 'admin')

      expect(User.whistleblower_recipients).to eq([flagged])
    end

    it 'reads in name order' do
      zoe = create(:user, first_name: 'Zoe', whistleblower_recipient: true)
      ada = create(:user, first_name: 'Ada', whistleblower_recipient: true)

      expect(User.whistleblower_recipients.to_a).to eq([ada, zoe])
    end

    it 'leaves out a soft-deleted recipient' do
      create(:user, whistleblower_recipient: true).destroy

      expect(User.whistleblower_recipients).to be_empty
    end
  end

  describe '.whistleblower_minimum' do
    it 'is three once three people can receive a report' do
      create_list(:user, 4, whistleblower_recipient: true)

      expect(User.whistleblower_minimum).to eq(3)
    end

    # Otherwise a pool of two would leave the form asking for three forever.
    it 'drops to the size of the pool when fewer than three exist' do
      create_list(:user, 2, whistleblower_recipient: true)

      expect(User.whistleblower_minimum).to eq(2)
    end

    it 'is zero when nobody is flagged' do
      expect(User.whistleblower_minimum).to eq(0)
    end
  end
end
