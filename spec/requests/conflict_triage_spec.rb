# frozen_string_literal: true

require 'rails_helper'

# The triage screens themselves (Flow 5). Both roles render the same widget
# from the same entrypoint; only the base path differs.
RSpec.describe 'Conflict triage screens', type: :request do
  let(:season) { create(:season, year: Date.today.year) }

  before do
    allow(ActivityLogger).to receive(:log_conflict)
    create(:conflict_status, name: 'Pending')
  end

  describe 'GET /admin/conflicts' do
    before { sign_in_as_admin(season: season) }

    it 'renders the shared triage mount with the admin base path' do
      get '/admin/conflicts'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('data-base-path="/admin/conflicts"')
      expect(response.body).to include('id="conflicts"')
    end

    it 'passes the season ensembles for the filter' do
      member = create(:user)
      create(:seasons_user, user: member, season: season, role: 'member', ensemble: 'Battery')

      get '/admin/conflicts'

      expect(response.body).to include('Battery')
    end
  end

  describe 'GET /coordinators/conflicts' do
    before { sign_in_as_coordinator(season: season) }

    it 'renders the same widget with the coordinator base path' do
      get '/coordinators/conflicts'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('data-base-path="/coordinators/conflicts"')
      expect(response.body).to include('id="conflicts"')
    end
  end

  describe 'the shared conflict form' do
    let(:member) { create(:user, first_name: 'Wes', last_name: 'Hardin') }

    before do
      create(:seasons_user, user: member, season: season, role: 'member', ensemble: 'Battery')
      sign_in_as_coordinator(season: season)
    end

    it 'renders one shared form for both namespaces' do
      get '/coordinators/conflicts/new'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('conflictTriageForm')
      expect(response.body).to include('Wes Hardin')
    end

    # Coordinators record conflicts after the fact, so the future-date
    # validation the member form enforces must not apply here.
    it 'accepts a past date on create' do
      status = ConflictStatus.find_by(name: 'Pending')

      expect do
        post '/coordinators/conflicts', params: {
          conflict: {
            user_id: member.id,
            status_id: status.id,
            start_date_date: (Date.current - 10.days).to_s,
            start_date_time: '18:30',
            end_date_date: (Date.current - 10.days).to_s,
            end_date_time: '21:30',
            reason: 'Recorded after the fact'
          }
        }
      end.to change(Conflict, :count).by(1)

      expect(Conflict.last.start_date).to be < Time.current
    end

    # This used to redirect to the dashboard, losing the coordinator's place.
    it 'returns to the queue after creating' do
      status = ConflictStatus.find_by(name: 'Pending')

      post '/coordinators/conflicts', params: {
        conflict: {
          user_id: member.id, status_id: status.id,
          start_date_date: (Date.current + 3.days).to_s, start_date_time: '18:30',
          end_date_date: (Date.current + 3.days).to_s, end_date_time: '21:30',
          reason: 'Work'
        }
      }

      expect(response).to redirect_to('/coordinators/conflicts')
    end

    it 'redraws the form with the errors when invalid' do
      post '/coordinators/conflicts', params: {
        conflict: { user_id: member.id, reason: '' }
      }

      expect(response).to have_http_status(:success)
      expect(response.body).to include('conflictTriageForm')
    end

    it 'edits an existing conflict through the same form' do
      conflict = create(
        :conflict, user: member, season: season,
                   conflict_status: ConflictStatus.find_by(name: 'Pending'),
                   skip_future_date_validation: true
      )

      get "/coordinators/conflicts/#{conflict.id}/edit"

      expect(response).to have_http_status(:success)
      expect(response.body).to include('conflictTriageForm')
    end
  end

  describe 'the nav badge' do
    let(:member) { create(:user) }

    before do
      create(:seasons_user, user: member, season: season, role: 'member')
      sign_in_as_coordinator(season: season)
    end

    it 'counts what is waiting, and announces it rather than showing a bare number' do
      create(
        :conflict,
        user: member, season: season,
        conflict_status: ConflictStatus.find_by(name: 'Pending'),
        start_date: Date.current + 5.days, end_date: Date.current + 5.days + 3.hours,
        skip_future_date_validation: true
      )

      get '/coordinators'

      expect(response.body).to include('waiting on a decision')
    end

    it 'carries no badge at all when the queue is clear' do
      get '/coordinators'

      expect(response.body).not_to include('waiting on a decision')
    end
  end

  describe 'GET /coordinators (the rebuilt dashboard)' do
    let(:member) { create(:user, first_name: 'Elena', last_name: 'Sokol') }

    before do
      create(:seasons_user, user: member, season: season, role: 'member', ensemble: 'Front ensemble')
      sign_in_as_coordinator(season: season)
    end

    it 'leads with the backlog rather than a second calendar' do
      create(
        :conflict,
        user: member, season: season,
        conflict_status: ConflictStatus.find_by(name: 'Pending'),
        start_date: Date.current + 5.days, end_date: Date.current + 5.days + 3.hours,
        skip_future_date_validation: true
      )

      get '/coordinators'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('triage-dashboard')
      expect(response.body).to include('data-pending-count="1"')
      expect(response.body).to include('Elena Sokol')
    end

    it 'reports a clear queue as zero rather than omitting the count' do
      get '/coordinators'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('data-pending-count="0"')
    end
  end

  # redirect_if_not is an exact role match, not a hierarchy: each role reaches
  # its own screen and is redirected away from the other's.
  it 'keeps a coordinator out of the admin screen' do
    sign_in_as_coordinator(season: season)

    get '/admin/conflicts'

    expect(response).to have_http_status(:found)
  end

  it 'keeps a member out of both' do
    sign_in_as_member(season: season)

    get '/admin/conflicts'
    expect(response).to have_http_status(:found)

    get '/coordinators/conflicts'
    expect(response).to have_http_status(:found)
  end
end
