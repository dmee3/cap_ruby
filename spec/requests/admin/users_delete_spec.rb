# frozen_string_literal: true

require 'rails_helper'

# Deleting a person from /admin/users/:id/edit, and putting them back.
RSpec.describe 'Admin user delete', type: :request do
  let(:season) { create(:season, year: Date.today.year) }

  def create_member(season)
    create(:user, first_name: 'Nadia', last_name: 'Osei').tap do |u|
      create(:seasons_user, user: u, season: season, role: 'member', ensemble: 'World', section: 'Snare')
    end
  end

  describe 'DELETE /admin/users/:id' do
    it 'soft-deletes the person so nothing is erased' do
      sign_in_as_admin(season: season)
      user = create_member(season)

      delete "/admin/users/#{user.id}"

      expect(User.where(id: user.id)).not_to exist
      expect(User.with_deleted.find(user.id).deleted_at).to be_present
    end

    # The whole reason this bead blocked on acts_as_paranoid: the schedule and
    # its entries used to be hard-destroyed, so a restore returned someone who
    # owed nothing and had no record of ever being billed.
    it 'keeps the payment schedule and its entries recoverable' do
      sign_in_as_admin(season: season)
      user = create_member(season)
      schedule = create(:payment_schedule, user: user, season: season)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current, amount: 10_000)

      delete "/admin/users/#{user.id}"

      expect(PaymentSchedule.where(id: schedule.id)).not_to exist
      expect(PaymentSchedule.with_deleted.where(id: schedule.id)).to exist
      expect(PaymentScheduleEntry.with_deleted.where(payment_schedule_id: schedule.id).count).to eq(1)
    end

    # The season rows are what a restore rebuilds the person's history from,
    # and active_for_authentication? reads them — losing them would return
    # someone who could not sign in.
    it 'leaves the seasons_users rows alone' do
      sign_in_as_admin(season: season)
      user = create_member(season)

      delete "/admin/users/#{user.id}"

      expect(SeasonsUser.where(user_id: user.id).count).to eq(1)
    end

    it 'lands back on the edit page, which is where Restore lives' do
      sign_in_as_admin(season: season)
      user = create_member(season)

      delete "/admin/users/#{user.id}"

      expect(response).to redirect_to("/admin/users/#{user.id}/edit")
    end

    it 'is refused to a member' do
      sign_in_as_member(season: season)
      user = create_member(season)

      delete "/admin/users/#{user.id}"

      expect(User.where(id: user.id)).to exist
    end
  end

  describe 'POST /admin/users/:id/restore' do
    it 'brings back the person and everything that went down with them' do
      sign_in_as_admin(season: season)
      user = create_member(season)
      schedule = create(:payment_schedule, user: user, season: season)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current, amount: 10_000)
      payment = create(:payment, user: user, season: season, amount: 5000, date_paid: Date.current)

      delete "/admin/users/#{user.id}"
      post "/admin/users/#{user.id}/restore"

      expect(User.where(id: user.id)).to exist
      expect(PaymentSchedule.where(id: schedule.id)).to exist
      expect(PaymentScheduleEntry.where(payment_schedule_id: schedule.id).count).to eq(1)
      expect(Payment.where(id: payment.id)).to exist
    end

    # A restored member has to be able to sign in again, which means both a
    # live user record and a season row Devise will accept.
    it 'returns someone who can sign in' do
      sign_in_as_admin(season: season)
      user = create_member(season)

      delete "/admin/users/#{user.id}"
      post "/admin/users/#{user.id}/restore"

      expect(User.find(user.id).active_for_authentication?).to be(true)
    end

    it 'is refused to a member' do
      admin_season = season
      sign_in_as_admin(season: admin_season)
      user = create_member(admin_season)
      delete "/admin/users/#{user.id}"

      sign_in_as_member(season: admin_season)
      post "/admin/users/#{user.id}/restore"

      expect(User.where(id: user.id)).not_to exist
    end
  end

  describe 'GET /admin/users/:id/edit' do
    it 'still renders for a deleted person, carrying the restore panel' do
      sign_in_as_admin(season: season)
      user = create_member(season)
      delete "/admin/users/#{user.id}"

      get "/admin/users/#{user.id}/edit"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('&quot;deleted&quot;:true')
    end
  end
end
