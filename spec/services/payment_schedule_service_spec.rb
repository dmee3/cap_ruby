# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PaymentScheduleService do
  describe '.default_schedule_for' do
    let(:season_2026) { create(:season, year: '2026') }
    let(:user) { create(:user) }

    context 'rookie member (no previous seasons)' do
      it 'returns rookie schedule for World Music' do
        create(:seasons_user, user: user, season: season_2026, role: 'member', ensemble: 'World', section: 'Snare')

        schedule = PaymentScheduleService.default_schedule_for(user, season_2026)

        expect(schedule).to be_present
        expect(schedule['10/17/25']).to eq(500) # First payment
        expect(schedule['11/14/25']).to eq(400) # Rookie amount for World Music
      end

      it 'returns rookie schedule for World Visual' do
        create(:seasons_user, user: user, season: season_2026, role: 'member', ensemble: 'World', section: 'Visual')

        schedule = PaymentScheduleService.default_schedule_for(user, season_2026)

        expect(schedule).to be_present
        expect(schedule['10/17/25']).to eq(500)
        expect(schedule['11/14/25']).to eq(340) # Rookie amount for World Visual
      end

      it 'returns rookie schedule for CC2 Music' do
        create(:seasons_user, user: user, season: season_2026, role: 'member', ensemble: 'CC2', section: 'Tenors')

        schedule = PaymentScheduleService.default_schedule_for(user, season_2026)

        expect(schedule).to be_present
        expect(schedule['10/17/25']).to eq(500)
        expect(schedule['11/14/25']).to eq(340) # Rookie amount for CC2 Music
      end

      it 'returns rookie schedule for CC2 Visual' do
        create(:seasons_user, user: user, season: season_2026, role: 'member', ensemble: 'CC2', section: 'Visual')

        schedule = PaymentScheduleService.default_schedule_for(user, season_2026)

        expect(schedule).to be_present
        expect(schedule['10/17/25']).to eq(500)
        expect(schedule['11/14/25']).to eq(280) # Rookie amount for CC2 Visual
      end
    end

    context 'vet member (has previous season)' do
      let(:season_2025) { create(:season, year: '2025') }

      before do
        # User was in previous season
        create(:seasons_user, user: user, season: season_2025, role: 'member', ensemble: 'World', section: 'Snare')
      end

      it 'returns vet schedule for World Music' do
        create(:seasons_user, user: user, season: season_2026, role: 'member', ensemble: 'World', section: 'Snare')

        schedule = PaymentScheduleService.default_schedule_for(user, season_2026)

        expect(schedule).to be_present
        expect(schedule['10/17/25']).to eq(500)
        expect(schedule['11/14/25']).to eq(360) # Vet amount for World Music (less than rookie)
      end

      it 'returns vet schedule for World Visual' do
        create(:seasons_user, user: user, season: season_2026, role: 'member', ensemble: 'World', section: 'Visual')

        schedule = PaymentScheduleService.default_schedule_for(user, season_2026)

        expect(schedule).to be_present
        expect(schedule['10/17/25']).to eq(500)
        expect(schedule['11/14/25']).to eq(300) # Vet amount for World Visual
      end

      it 'returns vet schedule for CC2 Music' do
        create(:seasons_user, user: user, season: season_2026, role: 'member', ensemble: 'CC2', section: 'Snare')

        schedule = PaymentScheduleService.default_schedule_for(user, season_2026)

        expect(schedule).to be_present
        expect(schedule['10/17/25']).to eq(500)
        expect(schedule['11/14/25']).to eq(300) # Vet amount for CC2 Music
      end

      it 'returns vet schedule for CC2 Visual' do
        create(:seasons_user, user: user, season: season_2026, role: 'member', ensemble: 'CC2', section: 'Visual')

        schedule = PaymentScheduleService.default_schedule_for(user, season_2026)

        expect(schedule).to be_present
        expect(schedule['10/17/25']).to eq(500)
        expect(schedule['11/14/25']).to eq(240) # Vet amount for CC2 Visual
      end
    end

    context 'edge cases' do
      it 'returns nil if user has no role for the season' do
        schedule = PaymentScheduleService.default_schedule_for(user, season_2026)

        expect(schedule).to be_nil
      end

      it 'returns schedule even for non-member roles (method does not filter by role)' do
        create(:seasons_user, user: user, season: season_2026, role: 'admin', ensemble: 'World', section: 'Snare')

        schedule = PaymentScheduleService.default_schedule_for(user, season_2026)

        # Method looks up schedule based on ensemble/section, not role
        expect(schedule).to be_present
      end
    end
  end

  describe '.ensure_payment_schedules_for_user' do
    let(:season) { create(:season, year: '2026') }
    let(:user) { create(:user) }

    it 'creates payment schedule for member without one' do
      create(:seasons_user, user: user, season: season, role: 'member')

      expect do
        PaymentScheduleService.ensure_payment_schedules_for_user(user)
      end.to change(PaymentSchedule, :count).by(1)

      schedule = PaymentSchedule.last
      expect(schedule.user).to eq(user)
      expect(schedule.season).to eq(season)
    end

    it 'does not create duplicate payment schedules' do
      create(:seasons_user, user: user, season: season, role: 'member')
      create(:payment_schedule, user: user, season: season)

      expect do
        PaymentScheduleService.ensure_payment_schedules_for_user(user)
      end.not_to change(PaymentSchedule, :count)
    end

    it 'skips non-member roles' do
      create(:seasons_user, user: user, season: season, role: 'admin')

      expect do
        PaymentScheduleService.ensure_payment_schedules_for_user(user)
      end.not_to change(PaymentSchedule, :count)
    end

    it 'creates schedules for multiple seasons' do
      season1 = create(:season, year: '2025')
      season2 = create(:season, year: '2026')
      create(:seasons_user, user: user, season: season1, role: 'member')
      create(:seasons_user, user: user, season: season2, role: 'member')

      expect do
        PaymentScheduleService.ensure_payment_schedules_for_user(user)
      end.to change(PaymentSchedule, :count).by(2)
    end
  end
end
