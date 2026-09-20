# frozen_string_literal: true

require 'rails_helper'

# A user is soft-deleted, but their payments, schedules and conflicts are still
# reachable from admin screens. Without `-> { with_deleted }` on the belongs_to,
# record.user comes back nil and every presenter that calls through it dies with
# "undefined method 'payments_for' for nil:NilClass".
RSpec.describe 'records owned by a soft-deleted user' do
  let(:season) { create(:season, year: '2025') }
  let(:user) do
    create(:user, first_name: 'Matthew', last_name: 'Kramer').tap do |u|
      create(:seasons_user, user: u, season: season, role: 'member', ensemble: 'World', section: 'Snare')
    end
  end

  # The user here is soft-deleted around the association rather than through
  # `destroy`, which matches the production case this was written for: a
  # schedule whose owner was soft-deleted in 2024 by other means.
  it 'still resolves the owner of a payment schedule' do
    schedule = create(:payment_schedule, user: user, season: season)
    User.where(id: user.id).update_all(deleted_at: Time.current)

    expect(schedule.reload.user).to eq(user)
    expect(schedule.user.full_name).to eq('Matthew Kramer')
  end

  it 'still resolves the owner of a payment' do
    payment = create(:payment, user: user, season: season, amount: 50_000, date_paid: Date.current)
    user.destroy

    expect(Payment.with_deleted.find(payment.id).user).to eq(user)
  end

  # The exact crash reported: "undefined method 'payments_for' for nil:NilClass"
  # when opening a schedule whose owner had been soft-deleted.
  it 'renders the schedule editor for a soft-deleted member' do
    schedule = create(:payment_schedule, user: user, season: season)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current, amount: 10_000)
    User.where(id: user.id).update_all(deleted_at: Time.current)

    expect { Admin::ScheduleEditorPresenter.call(schedule.reload, season.attributes) }.not_to raise_error
  end

  # The payments list joins users, so before this change a payment whose owner
  # was soft-deleted dropped out of the list while STILL counting toward the
  # season total — the list disagreed with its own total by that amount. In the
  # 2022 production data that gap was $400.
  it 'keeps the payments list reconciled with the season total' do
    create(:payment, user: user, season: season, amount: 40_000, date_paid: Date.current)
    User.where(id: user.id).update_all(deleted_at: Time.current)

    listed = Payment.with_deleted.joins(:user, :payment_type)
                    .for_season(season.id).where(deleted_at: nil).sum(:amount)
    counted = Payment.for_season(season.id).sum(:amount)

    expect(listed).to eq(counted)
  end

  # The case actually found in the database: a payment created AFTER the user
  # was soft-deleted stays live with a dangling user_id.
  it 'renders Member 360 when a live payment outlives its deleted user' do
    schedule = create(:payment_schedule, user: user, season: season)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current, amount: 10_000)
    create(:payment, user: user, season: season, amount: 5000, date_paid: Date.current)
    User.where(id: user.id).update_all(deleted_at: Time.current)

    expect do
      Admin::Member360Presenter.call(User.with_deleted.find(user.id), season.attributes)
    end.not_to raise_error
  end
end
