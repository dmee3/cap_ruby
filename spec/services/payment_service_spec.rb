# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PaymentService do
  let(:season) { create(:season, year: '2025') }
  let(:payment_type) { create(:payment_type, name: 'Cash') }

  describe '.amount_owed_on_date' do
    let(:user) { create(:user) }
    let!(:payment_schedule) { create(:payment_schedule, user: user, season: season) }

    before do
      create(:seasons_user, user: user, season: season, role: 'member')
    end

    context 'when user has no payment schedule' do
      it 'returns 0' do
        user_without_schedule = create(:user)
        create(:seasons_user, user: user_without_schedule, season: season, role: 'member')

        amount = PaymentService.amount_owed_on_date(user_without_schedule, Date.today, season.id)

        expect(amount).to eq(0)
      end
    end

    context 'when user has payment schedule but no payments' do
      it 'returns full amount owed' do
        create(:payment_schedule_entry, payment_schedule: payment_schedule, amount: 50000, pay_date: 1.week.ago)
        create(:payment_schedule_entry, payment_schedule: payment_schedule, amount: 30000, pay_date: Date.today)

        amount = PaymentService.amount_owed_on_date(user, Date.today, season.id)

        expect(amount).to eq(800.00) # $500 + $300
      end
    end

    context 'when user has made partial payment' do
      it 'returns remaining amount owed' do
        create(:payment_schedule_entry, payment_schedule: payment_schedule, amount: 50000, pay_date: 1.week.ago)
        create(:payment_schedule_entry, payment_schedule: payment_schedule, amount: 30000, pay_date: Date.today)
        create(:payment, user: user, season: season, amount: 25000, payment_type: payment_type, date_paid: 2.days.ago)

        amount = PaymentService.amount_owed_on_date(user, Date.today, season.id)

        expect(amount).to eq(550.00) # $800 owed - $250 paid
      end
    end

    context 'when user has fully paid' do
      it 'returns 0' do
        create(:payment_schedule_entry, payment_schedule: payment_schedule, amount: 50000, pay_date: 1.week.ago)
        create(:payment, user: user, season: season, amount: 50000, payment_type: payment_type, date_paid: 2.days.ago)

        amount = PaymentService.amount_owed_on_date(user, Date.today, season.id)

        expect(amount).to eq(0.00)
      end
    end

    context 'when checking future date' do
      it 'only includes entries up to that date' do
        create(:payment_schedule_entry, payment_schedule: payment_schedule, amount: 50000, pay_date: 1.week.ago)
        create(:payment_schedule_entry, payment_schedule: payment_schedule, amount: 30000, pay_date: 1.week.from_now)

        amount = PaymentService.amount_owed_on_date(user, Date.today, season.id)

        expect(amount).to eq(500.00) # Only first entry
      end
    end
  end

  describe '.total_dues_owed_to_date' do
    it 'returns sum of all schedule entries up to today' do
      user1 = create(:user)
      user2 = create(:user)
      create(:seasons_user, user: user1, season: season, role: 'member')
      create(:seasons_user, user: user2, season: season, role: 'member')

      schedule1 = create(:payment_schedule, user: user1, season: season)
      schedule2 = create(:payment_schedule, user: user2, season: season)

      create(:payment_schedule_entry, payment_schedule: schedule1, amount: 50000, pay_date: 1.week.ago)
      create(:payment_schedule_entry, payment_schedule: schedule1, amount: 30000, pay_date: Date.today)
      create(:payment_schedule_entry, payment_schedule: schedule2, amount: 40000, pay_date: 1.week.ago)

      total = PaymentService.total_dues_owed_to_date(season.id)

      expect(total).to eq(120000) # $500 + $300 + $400
    end

    it 'excludes future schedule entries' do
      user = create(:user)
      create(:seasons_user, user: user, season: season, role: 'member')
      schedule = create(:payment_schedule, user: user, season: season)

      create(:payment_schedule_entry, payment_schedule: schedule, amount: 50000, pay_date: 1.week.ago)
      create(:payment_schedule_entry, payment_schedule: schedule, amount: 30000, pay_date: 1.week.from_now)

      total = PaymentService.total_dues_owed_to_date(season.id)

      expect(total).to eq(50000) # Only past entry
    end

    it 'returns 0 for season with no schedule entries' do
      total = PaymentService.total_dues_owed_to_date(season.id)

      expect(total).to eq(0)
    end
  end

  describe '.total_dues_paid_to_date' do
    it 'returns sum of all payments in season' do
      user1 = create(:user)
      user2 = create(:user)
      create(:seasons_user, user: user1, season: season, role: 'member')
      create(:seasons_user, user: user2, season: season, role: 'member')

      create(:payment, user: user1, season: season, amount: 50000, payment_type: payment_type, date_paid: 1.week.ago)
      create(:payment, user: user1, season: season, amount: 25000, payment_type: payment_type, date_paid: Date.today)
      create(:payment, user: user2, season: season, amount: 40000, payment_type: payment_type, date_paid: 2.days.ago)

      total = PaymentService.total_dues_paid_to_date(season.id)

      expect(total).to eq(115000) # $500 + $250 + $400
    end

    it 'excludes payments from other seasons' do
      other_season = create(:season, year: '2024')
      user = create(:user)
      create(:seasons_user, user: user, season: season, role: 'member')
      create(:seasons_user, user: user, season: other_season, role: 'member')

      create(:payment, user: user, season: season, amount: 50000, payment_type: payment_type, date_paid: Date.today)
      create(:payment, user: user, season: other_season, amount: 30000, payment_type: payment_type,
                       date_paid: Date.today)

      total = PaymentService.total_dues_paid_to_date(season.id)

      expect(total).to eq(50000) # Only current season
    end

    it 'returns 0 for season with no payments' do
      total = PaymentService.total_dues_paid_to_date(season.id)

      expect(total).to eq(0)
    end
  end

  describe '.upcoming_payments' do
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let!(:schedule1) { create(:payment_schedule, user: user1, season: season) }
    let!(:schedule2) { create(:payment_schedule, user: user2, season: season) }

    before do
      create(:seasons_user, user: user1, season: season, role: 'member')
      create(:seasons_user, user: user2, season: season, role: 'member')
    end

    it 'returns members who are behind on payments' do
      # User1 owes $500, paid $0
      create(:payment_schedule_entry, payment_schedule: schedule1, amount: 50000, pay_date: 1.week.from_now)

      # User2 owes $400, paid $400 (fully paid)
      create(:payment_schedule_entry, payment_schedule: schedule2, amount: 40000, pay_date: 1.week.from_now)
      create(:payment, user: user2, season: season, amount: 40000, payment_type: payment_type, date_paid: Date.today)

      upcoming = PaymentService.upcoming_payments(Date.today, 2.weeks.from_now, season.id)

      expect(upcoming.size).to eq(1)
      expect(upcoming.first[:user_id]).to eq(user1.id)
      expect(upcoming.first[:name]).to eq(user1.full_name)
    end

    it 'excludes members who are current or ahead on payments' do
      # User1 owes $500, paid $600 (overpaid)
      create(:payment_schedule_entry, payment_schedule: schedule1, amount: 50000, pay_date: 1.week.from_now)
      create(:payment, user: user1, season: season, amount: 60000, payment_type: payment_type, date_paid: Date.today)

      upcoming = PaymentService.upcoming_payments(Date.today, 2.weeks.from_now, season.id)

      expect(upcoming).to be_empty
    end

    it 'only includes entries in the date range' do
      create(:payment_schedule_entry, payment_schedule: schedule1, amount: 50000, pay_date: 1.month.from_now)

      upcoming = PaymentService.upcoming_payments(Date.today, 2.weeks.from_now, season.id)

      expect(upcoming).to be_empty
    end
  end
end
