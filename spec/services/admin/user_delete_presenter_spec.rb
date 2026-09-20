# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::UserDeletePresenter do
  let(:season) { create(:season, year: '2026') }
  let(:current_season) { season.attributes }
  let(:user) { create(:user, first_name: 'Nadia', last_name: 'Osei') }

  describe 'the roster line' do
    it 'names the seasons someone is actually on' do
      create(:seasons_user, user: user, season: season, role: 'member')

      expect(described_class.call(user.reload, current_season)[:roster_line])
        .to eq('On the 2026 roster.')
    end

    # The people most likely to be deleted are the ones on no roster at all,
    # so this is the common case, not the edge one.
    it 'says so when someone is on no roster' do
      expect(described_class.call(user, current_season)[:roster_line])
        .to eq('They are not on any season roster.')
    end

    # A removed row is a membership that ended, not a current one.
    it 'treats a removed season as no roster' do
      create(:seasons_user, user: user, season: season, role: 'removed')

      expect(described_class.call(user.reload, current_season)[:roster_line])
        .to eq('They are not on any season roster.')
    end

    it 'lists several seasons newest first' do
      create(:seasons_user, user: user, season: season, role: 'member')
      create(:seasons_user, user: user, season: create(:season, year: '2025'), role: 'member')

      expect(described_class.call(user.reload, current_season)[:roster_line])
        .to eq('On the 2026, 2025 rosters.')
    end
  end

  describe 'what the confirm says goes' do
    it 'counts the schedule and its entries' do
      schedule = create(:payment_schedule, user: user, season: season)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current, amount: 10_000)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current, amount: 20_000)

      expect(described_class.call(user.reload, current_season)[:removed])
        .to include('1 payment schedule (2 scheduled payments)')
    end

    it 'counts payments and conflicts' do
      create(:payment, user: user, season: season, amount: 5000, date_paid: Date.current)

      expect(described_class.call(user.reload, current_season)[:removed])
        .to include('1 recorded payment')
    end

    # A list that reads "0 payments" invites skimming past the ones that
    # aren't zero.
    it 'leaves out the things they do not have' do
      items = described_class.call(user, current_season)[:removed]

      expect(items.join(' ')).not_to match(/\b0 /)
      expect(items).to include('Their sign-in, so they can no longer log in')
    end
  end

  # The panel tells the admin everything it just listed can be brought back.
  # Asserting the sentence only proves the sentence, so this deletes the person
  # and checks each listed record is still there to recover.
  describe 'the recoverability the confirm promises' do
    it 'holds for every record the removed list names' do
      create(:seasons_user, user: user, season: season, role: 'member')
      schedule = create(:payment_schedule, user: user, season: season)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current, amount: 10_000)
      create(:payment, user: user, season: season, amount: 5000, date_paid: Date.current)
      user.reload

      expect(described_class.call(user, current_season)[:stays])
        .to include('Everything above is recoverable — nothing is erased from the database')

      user.destroy

      expect(User.with_deleted.where(id: user.id)).to exist
      expect(PaymentSchedule.with_deleted.where(user_id: user.id)).to exist
      expect(PaymentScheduleEntry.with_deleted.where(payment_schedule_id: schedule.id)).to exist
      expect(Payment.with_deleted.where(user_id: user.id)).to exist
      expect(SeasonsUser.where(user_id: user.id)).to exist
    end
  end

  it 'gives the typed-name gate the name the panel shows' do
    expect(described_class.call(user, current_season)[:full_name]).to eq('Nadia Osei')
  end

  it 'flags a deleted person so the panel offers Restore instead' do
    user.destroy

    expect(described_class.call(User.with_deleted.find(user.id), current_season)[:deleted]).to be(true)
  end
end
