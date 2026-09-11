# frozen_string_literal: true

require 'rails_helper'

# The shared conflicts API that replaced Api::Admin::ConflictsController and
# Api::Coordinators::ConflictsController (Flow 5). Both roles reach the same
# endpoint; nothing on this screen is admin-only.
RSpec.describe 'Api::Conflicts', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:pending_status) { create(:conflict_status, name: 'Pending') }
  let(:approved_status) { create(:conflict_status, name: 'Approved') }
  let(:denied_status) { create(:conflict_status, name: 'Denied') }

  before { allow(ActivityLogger).to receive(:log_conflict) }

  def member_in(season, first_name: 'Ada', last_name: 'Lovelace', ensemble: 'Battery', section: 'Snare')
    user = create(:user, first_name: first_name, last_name: last_name)
    create(:seasons_user, user: user, season: season, role: 'member', ensemble: ensemble, section: section)
    user
  end

  def conflict_for(user, starts:, ends:, status: nil, reason: 'Family wedding')
    create(
      :conflict,
      user: user,
      season: season,
      conflict_status: status || pending_status,
      start_date: starts,
      end_date: ends,
      reason: reason,
      skip_future_date_validation: true
    )
  end

  describe 'GET /api/conflicts' do
    describe 'the date range filter' do
      # Regression: start_param/end_param used to parse params[:start]/[:end],
      # discard the result, and return a hardcoded 2000-01-01 / 2030-01-01, so
      # every date-scoped request silently returned the whole season.
      let!(:member) { member_in(season) }

      let!(:inside) do
        conflict_for(member, starts: Date.current + 3.days, ends: Date.current + 3.days + 2.hours)
      end
      let!(:outside) do
        conflict_for(member, starts: Date.current + 300.days, ends: Date.current + 301.days)
      end

      before { sign_in_as_admin(season: season) }

      it 'excludes conflicts outside the requested window' do
        get '/api/conflicts', params: { start: Date.current.to_s, end: (Date.current + 7.days).to_s }

        ids = json_rows.map { |row| row['id'] }
        expect(ids).to include(inside.id)
        expect(ids).not_to include(outside.id)
      end

      it 'includes a conflict that straddles the start of the window' do
        straddler = conflict_for(
          member,
          starts: Date.current + 5.days,
          ends: Date.current + 20.days
        )

        get '/api/conflicts', params: { start: (Date.current + 10.days).to_s, end: (Date.current + 12.days).to_s }

        expect(json_rows.map { |row| row['id'] }).to include(straddler.id)
      end

      it 'returns everything in the season when no range is given' do
        get '/api/conflicts'

        expect(json_rows.map { |row| row['id'] }).to contain_exactly(inside.id, outside.id)
      end

      it 'ignores an unparseable range rather than blowing up' do
        get '/api/conflicts', params: { start: 'not-a-date', end: 'also-not-a-date' }

        expect(response).to have_http_status(:success)
        expect(json_rows.map { |row| row['id'] }).to contain_exactly(inside.id, outside.id)
      end
    end

    describe 'the status filter' do
      let!(:member) { member_in(season) }
      let!(:pending) { conflict_for(member, starts: Date.current + 3.days, ends: Date.current + 3.days + 2.hours) }
      let!(:approved) do
        conflict_for(member, starts: Date.current + 4.days, ends: Date.current + 4.days + 2.hours,
                             status: approved_status)
      end

      before { sign_in_as_coordinator(season: season) }

      it 'returns only the requested status' do
        get '/api/conflicts', params: { status: 'Pending' }

        expect(json_rows.map { |row| row['id'] }).to contain_exactly(pending.id)
      end

      it 'returns everything for an unknown or All status rather than nothing' do
        get '/api/conflicts', params: { status: 'All' }

        expect(json_rows.map { |row| row['id'] }).to contain_exactly(pending.id, approved.id)
      end

      it 'reports counts for every scope, not just the selected one' do
        get '/api/conflicts', params: { status: 'Pending' }

        expect(json_body['counts']).to include('Pending' => 1, 'Approved' => 1, 'All' => 2)
      end
    end

    describe 'the when filter' do
      let!(:member) { member_in(season) }
      let!(:upcoming) { conflict_for(member, starts: Date.current + 3.days, ends: Date.current + 3.days + 2.hours) }
      let!(:past) { conflict_for(member, starts: Date.current - 30.days, ends: Date.current - 30.days + 2.hours) }

      before { sign_in_as_admin(season: season) }

      it 'scopes to upcoming' do
        get '/api/conflicts', params: { when: 'upcoming' }

        expect(json_rows.map { |row| row['id'] }).to contain_exactly(upcoming.id)
      end

      it 'scopes to past' do
        get '/api/conflicts', params: { when: 'past' }

        expect(json_rows.map { |row| row['id'] }).to contain_exactly(past.id)
      end
    end

    describe 'the ensemble filter' do
      let!(:battery_member) { member_in(season, first_name: 'Bea', ensemble: 'Battery', section: 'Snare') }
      let!(:front_member) do
        member_in(season, first_name: 'Fin', last_name: 'Ng', ensemble: 'Front ensemble', section: 'Vibes')
      end
      let!(:battery_conflict) do
        conflict_for(battery_member, starts: Date.current + 3.days, ends: Date.current + 3.days + 2.hours)
      end
      let!(:front_conflict) do
        conflict_for(front_member, starts: Date.current + 4.days, ends: Date.current + 4.days + 2.hours)
      end

      before { sign_in_as_admin(season: season) }

      it 'scopes to one ensemble' do
        get '/api/conflicts', params: { ensemble: 'Battery' }

        expect(json_rows.map { |row| row['id'] }).to contain_exactly(battery_conflict.id)
      end
    end

    describe 'grouping by member' do
      let!(:marcus) { member_in(season, first_name: 'Marcus', last_name: 'Webb', section: 'Snare') }
      let!(:elena) do
        member_in(season, first_name: 'Elena', last_name: 'Sokol', ensemble: 'Front ensemble', section: 'Vibes')
      end

      let!(:marcus_first) do
        conflict_for(marcus, starts: Date.current + 10.days, ends: Date.current + 10.days + 3.hours)
      end
      let!(:marcus_second) do
        conflict_for(marcus, starts: Date.current + 20.days, ends: Date.current + 20.days + 3.hours)
      end
      let!(:elena_only) do
        conflict_for(elena, starts: Date.current + 11.days, ends: Date.current + 11.days + 3.hours)
      end

      before { sign_in_as_coordinator(season: season) }

      it 'returns one group per member carrying the member identity' do
        get '/api/conflicts'

        marcus_group = json_body['groups'].find { |group| group['member'] == 'Marcus Webb' }
        expect(marcus_group['section']).to eq('Snare')
        expect(marcus_group['ensemble']).to eq('Battery')
        expect(marcus_group['rows'].map { |row| row['id'] }).to eq([marcus_first.id, marcus_second.id])
      end

      it 'counts pending per member' do
        get '/api/conflicts'

        marcus_group = json_body['groups'].find { |group| group['member'] == 'Marcus Webb' }
        elena_group = json_body['groups'].find { |group| group['member'] == 'Elena Sokol' }
        expect(marcus_group['pending_count']).to eq(2)
        expect(elena_group['pending_count']).to eq(1)
      end

      it 'carries the row shape ConflictPresenter produces' do
        get '/api/conflicts'

        row = json_body['groups'].first['rows'].first
        expect(row).to include('id', 'date_range_label', 'status', 'relative_subline')
      end

      it 'shows the reason on every triage row, unlike the member-facing list' do
        get '/api/conflicts'

        rows = json_body['groups'].flat_map { |group| group['rows'] }
        expect(rows).to all(include('reason'))
      end
    end

    describe 'authorization' do
      let!(:member) { member_in(season) }

      it 'is reachable by an admin' do
        sign_in_as_admin(season: season)
        get '/api/conflicts'

        expect(response).to have_http_status(:success)
      end

      it 'is reachable by a coordinator' do
        sign_in_as_coordinator(season: season)
        get '/api/conflicts'

        expect(response).to have_http_status(:success)
      end

      it 'is refused to a member' do
        sign_in_as_member(season: season)
        get '/api/conflicts', headers: { 'Accept' => 'application/json' }

        expect(response).to have_http_status(:unauthorized)
      end

      it 'is refused when signed out' do
        get '/api/conflicts'

        expect(response).not_to have_http_status(:success)
      end
    end

    it 'only returns conflicts for the current season' do
      other_season = create(:season, year: Date.today.year - 1)
      member = member_in(season)
      other_member = create(:user)
      create(:seasons_user, user: other_member, season: other_season, role: 'member')
      mine = conflict_for(member, starts: Date.current + 3.days, ends: Date.current + 3.days + 2.hours)
      create(
        :conflict,
        user: other_member, season: other_season, conflict_status: pending_status,
        start_date: Date.current + 3.days, end_date: Date.current + 3.days + 2.hours,
        skip_future_date_validation: true
      )

      sign_in_as_admin(season: season)
      get '/api/conflicts'

      expect(json_rows.map { |row| row['id'] }).to contain_exactly(mine.id)
    end
  end

  describe 'PUT /api/conflicts/:id' do
    let!(:member) { member_in(season) }
    let!(:conflict) { conflict_for(member, starts: Date.current + 3.days, ends: Date.current + 3.days + 2.hours) }

    it 'lets a coordinator approve' do
      sign_in_as_coordinator(season: season)

      put "/api/conflicts/#{conflict.id}", params: { conflict: { status_id: approved_status.id } }

      expect(response).to have_http_status(:success)
      expect(conflict.reload.status.name).to eq('Approved')
    end

    it 'lets an admin deny' do
      sign_in_as_admin(season: season)

      put "/api/conflicts/#{conflict.id}", params: { conflict: { status_id: denied_status.id } }

      expect(response).to have_http_status(:success)
      expect(conflict.reload.status.name).to eq('Denied')
    end

    it 'logs the decision so it can be attributed later' do
      allow(ActivityLogger).to receive(:log_conflict).and_call_original
      coordinator = sign_in_as_coordinator(season: season)

      put "/api/conflicts/#{conflict.id}", params: { conflict: { status_id: approved_status.id } }

      activity = Activity.where(activity_type: 'conflict').last
      expect(activity.created_by_id).to eq(coordinator.id)
      expect(activity.user_id).to eq(member.id)
    end

    it 'refuses a member' do
      sign_in_as_member(season: season)

      put "/api/conflicts/#{conflict.id}",
          params: { conflict: { status_id: approved_status.id } }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(conflict.reload.status.name).to eq('Pending')
    end
  end

  describe 'PUT /api/conflicts/bulk' do
    let!(:member) { member_in(season) }
    let!(:first) { conflict_for(member, starts: Date.current + 3.days, ends: Date.current + 3.days + 2.hours) }
    let!(:second) { conflict_for(member, starts: Date.current + 5.days, ends: Date.current + 5.days + 2.hours) }

    before { sign_in_as_coordinator(season: season) }

    it 'approves several conflicts at once' do
      put '/api/conflicts/bulk', params: { ids: [first.id, second.id], status_id: approved_status.id }

      expect(response).to have_http_status(:success)
      expect(first.reload.status.name).to eq('Approved')
      expect(second.reload.status.name).to eq('Approved')
    end

    it 'applies all or nothing' do
      put '/api/conflicts/bulk', params: { ids: [first.id, -1], status_id: approved_status.id }

      expect(response).not_to have_http_status(:success)
      expect(first.reload.status.name).to eq('Pending')
    end

    it 'refuses to touch another season' do
      other_season = create(:season, year: Date.today.year - 1)
      other_member = create(:user)
      create(:seasons_user, user: other_member, season: other_season, role: 'member')
      foreign = create(
        :conflict,
        user: other_member, season: other_season, conflict_status: pending_status,
        start_date: Date.current + 3.days, end_date: Date.current + 3.days + 2.hours,
        skip_future_date_validation: true
      )

      put '/api/conflicts/bulk', params: { ids: [foreign.id], status_id: approved_status.id }

      expect(foreign.reload.status.name).to eq('Pending')
    end
  end

  def json_body
    JSON.parse(response.body)
  end

  def json_rows
    json_body['groups'].flat_map { |group| group['rows'] }
  end
end
