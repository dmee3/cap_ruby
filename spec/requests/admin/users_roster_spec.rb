# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin::Users roster and onboarding', type: :request do
  let(:season) { create(:season, year: '2026') }
  let!(:admin) { sign_in_as_admin(season: season) }

  describe 'POST /admin/users' do
    # The form is the most complex in the app, so a failed save that throws it
    # away is expensive. It must come back with the values still in it.
    it 'creates a member and populates their payment schedule from the default' do
      expect do
        post '/admin/users', params: {
          user: {
            first_name: 'Iris', last_name: 'Nakamura',
            username: 'inakamura', email: 'iris.nakamura@example.com',
            password: 'abc12345',
            seasons_users_attributes: [
              { season_id: season.id, role: 'member', ensemble: 'World', section: 'Snare' }
            ]
          }
        }
      end.to change(User, :count).by(1)

      user = User.order(:id).last
      schedule = user.payment_schedules.first
      expect(schedule.entries.count).to eq(6)
      expect(schedule.entries.sum(:amount)).to eq(250_000)
    end

    it 're-renders with the submitted values when the save fails' do
      create(:user, email: 'taken@example.com', first_name: 'Ellis', last_name: 'Boyd')

      post '/admin/users', params: {
        user: {
          first_name: 'Theo', last_name: 'Grant',
          username: 'tgrant', email: 'taken@example.com', password: 'drum1'
        }
      }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.body).to include('Theo')
      expect(response.body).to include('tgrant')
    end

    it 'sends the welcome email on create, and only on create' do
      expect do
        post '/admin/users', params: {
          user: {
            first_name: 'Iris', last_name: 'Nakamura',
            username: 'inakamura2', email: 'iris2@example.com', password: 'abc12345',
            seasons_users_attributes: [{ season_id: season.id, role: 'member' }]
          }
        }
      end.to have_enqueued_mail(UserMailer, :welcome_email)
    end
  end

  describe 'PATCH /admin/users/:id' do
    let(:member) do
      create(:user, first_name: 'Gus', last_name: 'Halloway').tap do |u|
        create(:seasons_user, user: u, season: season, role: 'member', ensemble: 'World', section: 'Woods')
      end
    end

    # This used to redirect, losing everything typed. Flow 6's design depends on
    # the repopulated form, so the re-render is load-bearing, not cosmetic.
    it 're-renders instead of redirecting when the update fails' do
      create(:user, email: 'someone@example.com')

      patch "/admin/users/#{member.id}", params: { user: { email: 'someone@example.com' } }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response).not_to have_http_status(:found)
    end

    it 'does not send a welcome email on update' do
      expect do
        patch "/admin/users/#{member.id}", params: { user: { first_name: 'Gustavo' } }
      end.not_to have_enqueued_mail(UserMailer, :welcome_email)
    end

    # The reported bug: a member on 2026 only, adding 2027. With `[]` params the
    # new season's group (which has no id) swallowed the EXISTING row's id, so
    # Rails retargeted row 1935 at 2027 and tried to create a second 2026 row,
    # failing with "Seasons users user has already been taken".
    it 'adds a new season to a member who already has one' do
      other = create(:season, year: '2027')
      row = member.seasons_users.first
      body = [
        "user[seasons_users_attributes][0][season_id]=#{other.id}",
        'user[seasons_users_attributes][0][role]=member',
        'user[seasons_users_attributes][0][ensemble]=CC2',
        'user[seasons_users_attributes][0][section]=Auxiliary',
        "user[seasons_users_attributes][1][id]=#{row.id}",
        "user[seasons_users_attributes][1][season_id]=#{season.id}",
        'user[seasons_users_attributes][1][role]=member',
        'user[seasons_users_attributes][1][ensemble]=World',
        'user[seasons_users_attributes][1][section]=Woods'
      ].join('&')

      patch "/admin/users/#{member.id}",
            params: body,
            headers: { 'CONTENT_TYPE' => 'application/x-www-form-urlencoded' }

      expect(response).to have_http_status(:found)
      expect(member.reload.seasons_users.count).to eq(2)
      expect(member.seasons_users.map(&:season_id)).to match_array([season.id, other.id])
      # The pre-existing row kept its own season rather than being retargeted.
      expect(row.reload.season_id).to eq(season.id)
    end

    # Param-shape guard: a Ruby-hash params spec would serialize correctly even
    # if the form's name= attributes were wrong, so post a literal body.
    it 'accepts the nested seasons_users array the form actually posts' do
      row = member.seasons_users.first
      body = [
        'user[first_name]=Gus',
        'user[last_name]=Halloway',
        "user[seasons_users_attributes][][id]=#{row.id}",
        "user[seasons_users_attributes][][season_id]=#{season.id}",
        'user[seasons_users_attributes][][role]=staff',
        'user[seasons_users_attributes][][ensemble]=',
        'user[seasons_users_attributes][][section]='
      ].join('&')

      patch "/admin/users/#{member.id}",
            params: body,
            headers: { 'CONTENT_TYPE' => 'application/x-www-form-urlencoded' }

      expect(response).to have_http_status(:found)
      row.reload
      expect(row.role).to eq('staff')
      expect(member.reload.seasons_users.count).to eq(1)
      # Switching away from member must clear the old values rather than leave
      # them stale — disabled selects submit nothing, so the form posts blanks.
      expect(row.ensemble).to be_blank
      expect(row.section).to be_blank
    end
  end

  describe 'POST /admin/users/:id/send-reset' do
    let(:member) do
      create(:user, first_name: 'Gus', last_name: 'Halloway').tap do |u|
        create(:seasons_user, user: u, season: season, role: 'member')
      end
    end

    # Nothing set reset_password_sent_at before this: the welcome email only
    # links to the reset form, it never calls Devise's own sender.
    it 'sends the reset email and stamps when it went' do
      expect(member.reset_password_sent_at).to be_nil

      post "/admin/users/#{member.id}/send-reset"

      expect(response).to redirect_to("/admin/users/#{member.id}/edit")
      expect(member.reload.reset_password_sent_at).to be_present
    end

    it 'denies non-admins' do
      sign_in_as_member(season: season)
      post "/admin/users/#{member.id}/send-reset"
      expect(member.reload.reset_password_sent_at).to be_nil
    end
  end

  describe 'GET /api/admin/users' do
    it 'flags a member whose schedule exists but has no entries' do
      member = create(:user)
      create(:seasons_user, user: member, season: season, role: 'member', ensemble: 'World', section: 'Bass')
      create(:payment_schedule, user: member, season: season)

      get '/api/admin/users'

      row = response.parsed_body.find { |r| r['id'] == member.id }
      expect(row['has_schedule']).to be(false)
    end

    it 'lists people who are on no roster at all, bypassing the season scope' do
      stranded = create(:user, first_name: 'Theo', last_name: 'Grant')

      get '/api/admin/users', params: { roster: 'none' }

      names = response.parsed_body.map { |r| r['full_name'] }
      expect(names).to include('Theo Grant')
      expect(names).not_to include(admin.full_name)
      expect(response.parsed_body.find { |r| r['id'] == stranded.id }).to be_present
    end
  end

  describe 'GET /admin/users' do
    it 'mounts the roster island with the season it is scoped to' do
      get '/admin/users'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('id="users"')
      expect(response.body).to include('data-season-year="2026"')
    end

    it 'denies non-admins' do
      sign_in_as_member(season: season)
      get '/admin/users'
      expect(response).to have_http_status(:found)
    end
  end

  describe 'GET /admin/users/new' do
    it 'seeds the form island so a failed save can repopulate it' do
      get '/admin/users/new'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('id="user-form"')
      expect(response.body).to include('data-user-form=')
      expect(response.body).to include('seasons_users')
    end
  end

  describe 'GET /api/admin/schedule-forecast' do
    it 'forecasts a default without creating anything' do
      expect do
        get '/api/admin/schedule-forecast',
            params: { season_id: season.id, ensemble: 'World', section: 'Snare', vet: 'false' }
      end.not_to change(PaymentSchedule, :count)

      expect(response.parsed_body['total_cents']).to eq(250_000)
      expect(response.parsed_body['lookup_key']).to eq('World · Music · Rookie')
    end

    # Every non-Visual section keys to Music. The canvas calls this "Battery".
    it 'keys a non-Visual section to Music and Visual to Visual' do
      get '/api/admin/schedule-forecast',
          params: { season_id: season.id, ensemble: 'CC2', section: 'Visual', vet: 'true' }

      expect(response.parsed_body['lookup_key']).to eq('CC2 · Visual · Vet')
    end

    # DEFAULT_PAYMENT_SCHEDULES is a per-year table that runs out. Pick a year
    # beyond every key it has, rather than naming one: which years are filled
    # in changes as seasons are added.
    it 'reports no_default for a season with no defaults' do
      unscheduled = PaymentScheduleService.singleton_class::DEFAULT_PAYMENT_SCHEDULES.keys.map(&:to_i).max + 1
      future = create(:season, year: unscheduled.to_s)

      get '/api/admin/schedule-forecast',
          params: { season_id: future.id, ensemble: 'World', section: 'Snare', vet: 'false' }

      expect(response.parsed_body['no_default']).to be(true)
    end
  end
end
