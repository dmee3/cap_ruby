# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ActivityLogger do
  let(:user) { create(:user) }
  let(:current_user) { create(:user) }

  describe '.log_activity' do
    it 'creates an activity with the given attributes' do
      expect do
        described_class.log_activity(
          user_id: user.id,
          description: 'Did a thing',
          activity_date: Date.today,
          created_by_id: current_user.id,
          activity_type: 'custom'
        )
      end.to change(Activity, :count).by(1)

      activity = Activity.last
      expect(activity).to have_attributes(
        user_id: user.id,
        description: 'Did a thing',
        activity_date: Date.today,
        created_by_id: current_user.id,
        activity_type: 'custom'
      )
    end

    context 'when creation raises an error' do
      before do
        allow(Activity).to receive(:create).and_raise(StandardError.new('boom'))
        allow(Rollbar).to receive(:error)
      end

      it 'reports the error to Rollbar instead of raising' do
        expect do
          described_class.log_activity(
            user_id: user.id,
            description: 'Did a thing',
            activity_date: Date.today,
            created_by_id: current_user.id,
            activity_type: 'custom'
          )
        end.not_to raise_error

        expect(Rollbar).to have_received(:error).with(instance_of(StandardError), user: user)
      end
    end
  end

  describe '.log_conflict' do
    let(:status) { create(:conflict_status, name: 'Approved') }
    let(:start_date) { 30.days.from_now.change(hour: 18, min: 30) }
    let(:conflict) do
      create(:conflict, user: user, conflict_status: status, start_date: start_date, end_date: start_date + 1.day)
    end

    it 'creates an activity describing the conflict status change' do
      expect do
        described_class.log_conflict(conflict, current_user)
      end.to change(Activity, :count).by(1)

      activity = Activity.last
      expect(activity).to have_attributes(
        user_id: conflict.user_id,
        activity_date: Date.today,
        created_by_id: current_user.id,
        activity_type: 'conflict'
      )
      expected_start = start_date.strftime('%a, %-m/%-d %I:%M %p')
      expect(activity.description).to eq("Conflict for #{expected_start} marked approved")
    end

    it 'does nothing when conflict is nil' do
      expect do
        described_class.log_conflict(nil, current_user)
      end.not_to change(Activity, :count)
    end
  end

  describe '.log_payment' do
    let(:payment) { create(:payment, user: user, amount: 12_345, date_paid: Date.new(2026, 1, 5)) }

    it 'creates an activity describing the payment amount' do
      expect do
        described_class.log_payment(payment, current_user)
      end.to change(Activity, :count).by(1)

      activity = Activity.last
      expect(activity).to have_attributes(
        user_id: payment.user_id,
        activity_date: payment.date_paid,
        created_by_id: current_user.id,
        activity_type: 'payment'
      )
      expect(activity.description).to eq('Payment of $123.45 made')
    end

    it 'does nothing when payment is nil' do
      expect do
        described_class.log_payment(nil, current_user)
      end.not_to change(Activity, :count)
    end
  end
end
