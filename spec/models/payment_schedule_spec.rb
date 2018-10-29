require 'rails_helper'

RSpec.describe PaymentSchedule, type: :model do
  context 'scopes' do
    context 'for_season' do
      let(:season) { create(:season) }
      let(:other_season) { create(:season) }
      let(:schedule) { create(:payment_schedule, season: season) }
      let(:other_schedule) { create(:payment_schedule, season: other_season) }

      it 'returns schedules for the given season' do
        expect(described_class.for_season(season.id)).to eq([schedule])
      end
    end
  end

  context 'instance methods' do
    let!(:schedule) { create(:payment_schedule) }

    context 'scheduled_to_date' do
      before do
        [-10, -2, 0, 4].each do |i|
          create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.today + i.days, amount: 10000)
        end
      end

      context 'with no args' do
        subject { schedule.scheduled_to_date }
        it 'returns the total of scheduled payments to date' do
          expect(subject).to eq(30000)
        end
      end

      context 'with date given' do
        subject { schedule.scheduled_to_date(Date.today + 1.week) }
        it 'returns the total of scheduled payments to the given date' do
          expect(subject).to eq(40000)
        end
      end
    end
  end
end
