# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Staff dashboard', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:pending) { create(:conflict_status, name: 'Pending') }
  let(:approved) { create(:conflict_status, name: 'Approved') }

  def member(first_name:, last_name:, section: 'Snare')
    user = create(:user, first_name: first_name, last_name: last_name)
    create(:seasons_user, user: user, season: season, section: section, role: 'member')
    user
  end

  def conflict(user:, start_at:, status: pending, reason: 'Something came up')
    create(:conflict, user: user, season: season, conflict_status: status,
                      start_date: start_at, end_date: start_at + 3.hours, reason: reason)
  end

  before { sign_in_as_staff(season: season) }

  describe 'GET /staff with conflicts in the window' do
    before do
      conflict(user: member(first_name: 'Marcus', last_name: 'Webb'), start_at: 3.days.from_now)
      conflict(user: member(first_name: 'Elena', last_name: 'Sokol', section: 'Vibes'),
               start_at: 5.days.from_now, status: approved)
    end

    it 'mounts the conflicts widget with the members who are out' do
      get '/staff'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('id="staff-conflicts"')
      expect(response.body).to include('data-out-count="2"')
    end

    it 'groups them by the date they fall on' do
      get '/staff'

      groups = JSON.parse(CGI.unescapeHTML(response.body[/data-groups="([^"]*)"/, 1]))

      expect(groups.map { |g| g['date'] }).to eq(
        [3.days.from_now.to_date.iso8601, 5.days.from_now.to_date.iso8601]
      )
      expect(groups.map { |g| g['out_count'] }).to eq([1, 1])
    end

    it 'carries the status so a staff member can see where it landed' do
      get '/staff'

      groups = JSON.parse(CGI.unescapeHTML(response.body[/data-groups="([^"]*)"/, 1]))

      expect(groups.flat_map { |g| g['rows'].map { |r| r['status'] } }).to eq(%w[Pending Approved])
    end

    it 'offers no way to decide or edit, which staff cannot do' do
      get '/staff'

      groups = JSON.parse(CGI.unescapeHTML(response.body[/data-groups="([^"]*)"/, 1]))
      rows = groups.flat_map { |g| g['rows'] }

      keys = rows.flat_map(&:keys).uniq

      expect(keys).not_to include('edit_path')
      expect(keys).not_to include('editable')
      expect(keys).not_to include('reason')
    end
  end

  describe 'GET /staff with nobody out' do
    it 'reports an empty window as a count of zero rather than omitting it' do
      get '/staff'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('data-out-count="0"')
      expect(response.body).to include('data-groups="[]"')
    end

    it 'no longer renders the bare word None' do
      get '/staff'

      expect(response.body).not_to include('text-metric font-mono')
    end
  end

  describe 'GET /staff, the files card' do
    it 'shows files at every width, capped to a peek with a way to the rest' do
      get '/staff'

      expect(response.body).to include('id="files"')
      expect(response.body).to include('data-limit="3"')
      expect(response.body).not_to include('hidden lg:block')
    end
  end
end
