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

  describe 'GET /admin/users/:id for someone who is not a member this season' do
    let(:last_season) { create(:season, year: '2025') }
    let(:person) do
      create(:user, first_name: 'Theo', last_name: 'Grant', email: 'theo@example.com').tap do |u|
        create(:seasons_user, user: u, season: season, role: 'staff')
      end
    end

    it 'shows the person page instead of Member 360' do
      get "/admin/users/#{person.id}"

      expect(response).to have_http_status(:success)
      expect(response.body).not_to include('id="member-360"')
      expect(response.body).to include('Staff · 2026 season')
      expect(response.body).to include('theo@example.com')
    end

    it "lists dues from a season they marched, flagged when they're still owed" do
      create(:seasons_user, user: person, season: last_season, role: 'member', section: 'Tenors')
      schedule = create(:payment_schedule, season: last_season, user: person)
      create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 200.days, amount: 50_000)
      create(:payment, user: person, season: last_season, amount: 20_000, date_paid: Date.current - 200.days)

      get "/admin/users/#{person.id}"

      expect(response.body).to include('$200 of $500 paid')
      expect(response.body).to include('Outstanding')
    end

    it 'leaves out the dues section for someone who was never a member' do
      get "/admin/users/#{person.id}"

      expect(response.body).not_to include('Dues from member seasons')
    end

    it 'says so when they have no row in the season being viewed' do
      outsider = create(:user).tap { |u| create(:seasons_user, user: u, season: last_season, role: 'coordinator') }

      get "/admin/users/#{outsider.id}"

      expect(response.body).to include('Not on the 2026 roster')
    end

    it 'brings a reset sent from the person page back to it' do
      post "/admin/users/#{person.id}/send-reset", headers: { 'HTTP_REFERER' => "/admin/users/#{person.id}" }

      expect(response).to redirect_to("/admin/users/#{person.id}")
    end
  end

  # Removal overwrites the role, so whether a removed row was a member's is
  # read from the schedule PaymentScheduleService creates only for members.
  describe 'GET /admin/users/:id for someone removed from this season' do
    def removed_from_season_as(role)
      create(:user).tap do |u|
        create(:seasons_user, user: u, season: season, role: role)
        PaymentScheduleService.ensure_payment_schedules_for_user(u)
        SeasonRemovalService.remove(u, season.id, actor: admin)
      end
    end

    it 'keeps Member 360 for a removed member, whose dues still need settling' do
      get "/admin/users/#{removed_from_season_as('member').id}"

      expect(response.body).to include('id="member-360"')
    end

    it 'shows the person page for removed staff' do
      get "/admin/users/#{removed_from_season_as('staff').id}"

      expect(response.body).not_to include('id="member-360"')
      expect(response.body).to include('Removed · 2026 season')
    end
  end
end
