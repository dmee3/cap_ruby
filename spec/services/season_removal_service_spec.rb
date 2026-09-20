# frozen_string_literal: true

require 'rails_helper'

describe SeasonRemovalService do
  let(:season) { create(:season, year: '2026') }
  let(:user) { create(:user) }
  let(:admin) { create(:user) }

  def schedule_with(entries)
    schedule = create(:payment_schedule, user: user, season: season)
    entries.each_with_index do |cents, i|
      create(:payment_schedule_entry, payment_schedule: schedule, amount: cents,
                                      pay_date: Date.new(2025, 10, 1) + (i * 30))
    end
    schedule
  end

  def pay(cents)
    create(:payment, user: user, season: season, amount: cents)
  end

  describe '.remove' do
    before { create(:seasons_user, user: user, season: season, role: 'member') }

    it 'marks the membership removed without deleting the row' do
      described_class.remove(user, season.id)

      row = user.reload.seasons_users.first
      expect(row).to be_present
      expect(row.role).to eq('removed')
    end

    it 'leaves the season out of the roster while keeping the person on the record' do
      described_class.remove(user, season.id)

      expect(User.members_for_season(season.id)).not_to include(user)
      expect(SeasonsUser.where(user_id: user.id, season_id: season.id)).to exist
    end

    it 'cuts the schedule down to what has already been paid' do
      schedule_with([50_000, 50_000, 50_000])
      pay(60_000)

      described_class.remove(user, season.id)

      entries = user.reload.payment_schedule_for(season.id).entries
      expect(entries.sum(&:amount)).to eq(60_000)
      expect(entries.map(&:amount).sort).to eq([10_000, 50_000])
    end

    it 'empties the schedule when nothing has been paid' do
      schedule_with([50_000, 50_000])

      described_class.remove(user, season.id)

      expect(user.reload.payment_schedule_for(season.id).entries).to be_empty
    end

    it 'keeps the whole schedule when the member had paid it off' do
      schedule_with([50_000, 50_000])
      pay(100_000)

      described_class.remove(user, season.id)

      expect(user.reload.payment_schedule_for(season.id).entries.sum(&:amount)).to eq(100_000)
    end

    it 'leaves the member owing nothing, so they drop off the behind-on-payments list' do
      schedule_with([50_000, 50_000])
      pay(20_000)

      described_class.remove(user, season.id)

      expect(PaymentService.amount_owed_on_date(user.reload, Date.current, season.id)).to eq(0.0)
      expect(DashboardUtilities.behind_members(season.id).map { |m| m[:id] }).not_to include(user.id)
    end

    it 'keeps payments already made' do
      schedule_with([50_000])
      pay(20_000)

      described_class.remove(user, season.id)

      expect(user.reload.amount_paid_for(season.id)).to eq(20_000)
    end

    it 'takes the dues out of the season total rather than leaving them unowed' do
      schedule_with([50_000, 50_000])
      pay(20_000)
      before_total = PaymentService.total_dues_owed_to_date(season.id)

      described_class.remove(user, season.id)

      expect(PaymentService.total_dues_owed_to_date(season.id)).to eq(before_total - 80_000)
    end

    it 'does nothing the second time' do
      described_class.remove(user, season.id)

      expect(described_class.remove(user.reload, season.id)).to be_nil
    end

    it 'records who did it' do
      described_class.remove(user, season.id, actor: admin)

      activity = Activity.find_by(activity_type: 'season_membership')
      expect(activity.created_by_id).to eq(admin.id)
      expect(activity.description).to include('2026')
    end

    it 'copes with a member who never had a schedule' do
      expect { described_class.remove(user, season.id) }.not_to raise_error
      expect(user.reload.role_for(season.id)).to eq('removed')
    end

    it 'does nothing for a season the person was never on' do
      other = create(:season, year: '2024')

      expect(described_class.remove(user, other.id)).to be_nil
    end
  end

  describe 'access' do
    it 'keeps every other season reachable for someone removed from one' do
      past = create(:season, year: '2025')
      create(:seasons_user, user: user, season: past, role: 'member')
      create(:seasons_user, user: user, season: season, role: 'member')

      described_class.remove(user, season.id)

      expect(user.reload.active_seasons).to contain_exactly(past)
      expect(user).to be_active_for_authentication
    end

    it 'locks out someone whose only season was removed' do
      create(:seasons_user, user: user, season: season, role: 'member')

      described_class.remove(user, season.id)

      expect(user.reload.active_seasons).to be_empty
      expect(user).not_to be_active_for_authentication
    end
  end

  describe 'vet status' do
    it 'does not count a removed season towards being a vet' do
      create(:seasons_user, user: user, season: season, role: 'member')
      described_class.remove(user, season.id)

      later = create(:season, year: '2027')
      create(:seasons_user, user: user, season: later, role: 'member')

      expect(user.reload.vet_in?(later.id)).to be(false)
    end

    it 'still counts a season they actually marched' do
      create(:seasons_user, user: user, season: season, role: 'member')
      later = create(:season, year: '2027')
      create(:seasons_user, user: user, season: later, role: 'member')

      expect(user.reload.vet_in?(later.id)).to be(true)
    end
  end

  describe '.restore' do
    before do
      create(:seasons_user, user: user, season: season, role: 'member')
      schedule_with([50_000, 50_000])
      pay(20_000)
      described_class.remove(user, season.id)
      user.reload
    end

    it 'puts the membership back' do
      expect(described_class.restore(user, season.id)).to be_present
      expect(user.reload.role_for(season.id)).to eq('member')
      expect(User.members_for_season(season.id)).to include(user)
    end

    it 'leaves the schedule where removal left it, to be rebuilt by hand' do
      described_class.restore(user, season.id)

      expect(user.reload.payment_schedule_for(season.id).entries.sum(&:amount)).to eq(20_000)
    end

    it 'does not let ensure_payment_schedules_for_user quietly rebuild it' do
      described_class.restore(user, season.id)
      PaymentScheduleService.ensure_payment_schedules_for_user(user.reload)

      expect(user.reload.payment_schedule_for(season.id).entries.sum(&:amount)).to eq(20_000)
    end

    it 'does nothing for a membership that was not removed' do
      described_class.restore(user, season.id)

      expect(described_class.restore(user.reload, season.id)).to be_nil
    end
  end

  describe 'schedule creation' do
    it 'does not build a schedule for a season the person was removed from' do
      create(:seasons_user, user: user, season: season, role: 'member')
      described_class.remove(user, season.id)
      user.reload.payment_schedules.destroy_all

      PaymentScheduleService.ensure_payment_schedules_for_user(user.reload)

      expect(user.reload.payment_schedule_for(season.id)).to be_nil
    end
  end
end
