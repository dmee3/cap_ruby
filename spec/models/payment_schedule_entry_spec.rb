require 'rails_helper'

RSpec.describe PaymentScheduleEntry, type: :model do
  context 'scopes' do
    context 'past_entries' do
      let!(:future) { create(:payment_schedule_entry, pay_date: Date.tomorrow) }
      let!(:past) { create(:payment_schedule_entry, pay_date: Date.yesterday) }
      let!(:more_past) { create(:payment_schedule_entry, pay_date: Date.yesterday - 1.day) }

      it 'returns schedules for the given season' do
        expect(described_class.past_entries).to eq([past, more_past])
      end
    end
  end

  context 'instance methods' do
    context 'user' do
      let!(:entry) { create(:payment_schedule_entry) }
      subject { entry.user }
      it { is_expected.to eq entry.payment_schedule.user }
    end

    context 'total_to_date' do
      let!(:future) { create(:payment_schedule_entry, pay_date: Date.tomorrow) }
      let!(:past) { create(:payment_schedule_entry, pay_date: Date.yesterday) }
      let!(:more_past) { create(:payment_schedule_entry, pay_date: Date.yesterday - 1.day) }
      let!(:schedule) { create(:payment_schedule, payment_schedule_entries: [more_past, past, future]) }

      subject { past.total_to_date }

      it { is_expected.to eq(more_past.amount + past.amount) }
    end
  end
end
