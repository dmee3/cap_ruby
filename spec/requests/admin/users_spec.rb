# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin::Users Member 360', type: :request do
  let(:season) { create(:season, year: '2026') }
  let!(:admin) { sign_in_as_admin(season: season) }
  let(:member) do
    create(:user, first_name: 'Nina', last_name: 'Park').tap do |u|
      create(:seasons_user, user: u, season: season, role: 'member', ensemble: 'World', section: 'Snare')
    end
  end

  describe 'GET /admin/users/:id' do
    it 'mounts the member-360 island with the presenter view-model' do
      schedule = create(:payment_schedule, season: season, user: member)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 1.day, amount: 30_000)
      create(:payment, user: member, season: season, amount: 10_000, date_paid: Date.current)

      get "/admin/users/#{member.id}"

      expect(response).to have_http_status(:success)
      expect(response.body).to include('id="member-360"')
      expect(response.body).to include('Nina Park')
      expect(response.body).to include('roles_by_season')
    end

    # `data-member-360` reads back as dataset['member-360'], never
    # dataset.member360 — the entrypoint's guard silently failed and the page
    # rendered its skeleton forever. Keep digits out of the attribute name.
    it 'names the island attribute without a digit, so dataset dot-access works' do
      get "/admin/users/#{member.id}"

      expect(response.body).to include('data-member-detail=')
      expect(response.body).not_to include('data-member-360=')
    end

    it 'includes soft-deleted payments in the view-model, flagged' do
      gone = create(:payment, user: member, season: season, amount: 5000, date_paid: Date.current - 1.day)
      gone.destroy

      get "/admin/users/#{member.id}"

      expect(response.body).to include('&quot;deleted&quot;:true')
    end

    it 'denies non-admins' do
      sign_in_as_member(season: season)
      get "/admin/users/#{member.id}"
      expect(response).to have_http_status(:found)
    end
  end
end
