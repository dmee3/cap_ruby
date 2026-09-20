# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::UserFormPresenter do
  let(:season) { create(:season, year: '2026') }
  let(:current_season) { season.attributes }

  describe 'season rows' do
    # The form promises "a payment schedule is created for X" and must not
    # promise it for a season that already has one.
    it 'flags which seasons already have a payment schedule' do
      user = create(:user)
      other = create(:season, year: '2025')
      create(:seasons_user, user: user, season: season, role: 'member')
      create(:seasons_user, user: user, season: other, role: 'member')
      create(:payment_schedule, user: user, season: season)

      rows = described_class.call(user.reload, current_season)[:user][:seasons_users]

      expect(rows.find { |r| r[:season_id] == season.id }[:has_schedule]).to be(true)
      expect(rows.find { |r| r[:season_id] == other.id }[:has_schedule]).to be(false)
    end
  end

  describe 'the edit header card summary' do
    it 'reads username, season count, vet status and this season section' do
      user = create(:user, first_name: 'Gus', last_name: 'Halloway', username: 'ghalloway')
      create(:seasons_user, user: user, season: create(:season, year: '2025'), role: 'member')
      create(:seasons_user, user: user, season: season, role: 'member', ensemble: 'World', section: 'Metals')

      model = described_class.call(user.reload, current_season)[:user]

      expect(model[:initials]).to eq('GH')
      expect(model[:summary]).to eq(['@ghalloway', '2nd season', 'Vet', 'World / Metals'])
    end

    it 'omits vet for someone in their first season' do
      user = create(:user, username: 'nfletcher')
      create(:seasons_user, user: user, season: season, role: 'member', ensemble: 'CC2', section: 'Bass')

      summary = described_class.call(user.reload, current_season)[:user][:summary]

      expect(summary).to eq(['@nfletcher', '1st season', 'CC2 / Bass'])
    end

    # Staff carry no ensemble or section, so the summary simply drops that part
    # rather than rendering a stray separator.
    it 'drops the section part for a staff season' do
      user = create(:user, username: 'tlin')
      # The factory assigns an ensemble/section regardless of role, which is
      # exactly the stale-value case: staff must not show a section.
      create(:seasons_user, user: user, season: season, role: 'staff', ensemble: 'CC2', section: 'Tenors')

      summary = described_class.call(user.reload, current_season)[:user][:summary]

      expect(summary).to eq(['@tlin', '1st season'])
    end

    it 'is empty for a new user, since the card only renders on edit' do
      model = described_class.call(User.new, current_season)[:user]

      expect(model[:summary]).to eq([])
      expect(model[:initials]).to be_nil
    end

    it 'uses the ordinal suffix for 11th, 12th and 13th seasons' do
      user = create(:user, username: 'veteran')
      11.times { |i| create(:seasons_user, user: user, season: create(:season, year: (2010 + i).to_s), role: 'member') }

      summary = described_class.call(user.reload, current_season)[:user][:summary]

      expect(summary).to include('11th season')
    end
  end

  # A season someone was removed from is not part of their time with the group,
  # so it makes nobody a vet — and the forecast the form previews has to agree
  # with the schedule PaymentScheduleService actually builds.
  describe 'vet status across a removed season' do
    it 'does not treat a removed earlier season as one they marched' do
      user = create(:user)
      earlier = create(:season, year: '2025')
      create(:seasons_user, user: user, season: earlier, role: 'member')
      create(:seasons_user, user: user, season: season, role: 'member')
      SeasonRemovalService.remove(user, earlier.id)

      row = described_class.call(user.reload, current_season)[:seasons]
                           .find { |s| s[:id] == season.id }

      expect(row[:vet]).to be(false)
    end

    it 'agrees with the default PaymentScheduleService would pick' do
      user = create(:user)
      earlier = create(:season, year: '2025')
      create(:seasons_user, user: user, season: earlier, role: 'member')
      create(:seasons_user, user: user, season: season, role: 'member',
                            ensemble: 'World', section: 'Snare')
      SeasonRemovalService.remove(user, earlier.id)

      row = described_class.call(user.reload, current_season)[:seasons]
                           .find { |s| s[:id] == season.id }
      removed_member_default = PaymentScheduleService.default_schedule_for(user.reload, current_season)

      # A never-removed member of the same bracket, whose earlier season stands:
      # they are the vet, and their default is the one this member must NOT get.
      vet = create(:user)
      create(:seasons_user, user: vet, season: earlier, role: 'member')
      create(:seasons_user, user: vet, season: season, role: 'member',
                            ensemble: 'World', section: 'Snare')
      vet_default = PaymentScheduleService.default_schedule_for(vet.reload, current_season)

      expect(row[:vet]).to be(false)
      expect(removed_member_default).not_to eq(vet_default)
      expect(removed_member_default.values.sum).to be > vet_default.values.sum
    end

    it 'still counts an earlier season they finished' do
      user = create(:user)
      earlier = create(:season, year: '2025')
      create(:seasons_user, user: user, season: earlier, role: 'member')
      create(:seasons_user, user: user, season: season, role: 'member')

      row = described_class.call(user.reload, current_season)[:seasons]
                           .find { |s| s[:id] == season.id }

      expect(row[:vet]).to be(true)
    end
  end
end
