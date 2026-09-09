# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin::PaymentSchedules editor page', type: :request do
  let(:season) { create(:season, year: '2026') }
  let!(:admin) { sign_in_as_admin(season: season) }
  let(:member) do
    create(:user, first_name: 'Sam', last_name: 'Reed').tap do |u|
      create(:seasons_user, user: u, season: season, role: 'member', ensemble: 'World', section: 'Snare')
    end
  end
  let(:schedule) { create(:payment_schedule, season: season, user: member) }

  describe 'GET /admin/payment_schedules/:id/edit' do
    it 'mounts the editor island with the derived-status view-model' do
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 5.days, amount: 30_000)

      get "/admin/payment_schedules/#{schedule.id}/edit"

      expect(response).to have_http_status(:success)
      expect(response.body).to include('id="schedule-editor"')
      expect(response.body).to include('Sam Reed')
      expect(response.body).to include('data-editor=')
    end

    it 'denies non-admins' do
      sign_in_as_member(season: season)
      get "/admin/payment_schedules/#{schedule.id}/edit"
      expect(response).to have_http_status(:found)
    end
  end
end
