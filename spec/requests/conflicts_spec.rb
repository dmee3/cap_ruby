# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Conflicts Workflow', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:pending_status) { create(:conflict_status, name: 'Pending') }
  let(:approved_status) { create(:conflict_status, name: 'Approved') }

  before do
    # Stub external services
    allow(ActivityLogger).to receive(:log_conflict)
    allow(EmailService).to receive(:send_conflict_submitted_email)
  end

  # The member form posts two native inputs per boundary — build that shape.
  def conflict_form_params(start_at:, end_at:, reason: 'Family vacation')
    {
      conflict: {
        start_date_date: start_at.strftime('%Y-%m-%d'),
        start_date_time: start_at.strftime('%H:%M'),
        end_date_date: end_at.strftime('%Y-%m-%d'),
        end_date_time: end_at.strftime('%H:%M'),
        reason: reason
      }
    }
  end

  describe 'Member submits a new conflict' do
    it 'creates a conflict in pending state' do
      member = sign_in_as_member(season: season)
      pending_status # Ensure pending status exists

      expect do
        post '/members/conflicts', params: conflict_form_params(
          start_at: 1.week.from_now, end_at: 2.weeks.from_now
        )
      end.to change(Conflict, :count).by(1)

      conflict = Conflict.last
      expect(conflict.user).to eq(member)
      expect(conflict.season).to eq(season)
      expect(conflict.conflict_status.name).to eq('Pending')
      expect(conflict.reason).to eq('Family vacation')
      expect(response).to redirect_to(root_url)
      expect(flash[:success]).to match(/submitted for review/)
    end

    it 'rejects conflicts with past start dates' do
      sign_in_as_member(season: season)
      pending_status

      expect do
        post '/members/conflicts', params: conflict_form_params(
          start_at: 1.week.ago, end_at: 2.weeks.from_now
        )
      end.not_to change(Conflict, :count)

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Start date must be in the future')
    end

    it 'rejects conflicts with past end dates' do
      sign_in_as_member(season: season)
      pending_status

      expect do
        post '/members/conflicts', params: conflict_form_params(
          start_at: 1.week.from_now, end_at: 1.day.ago
        )
      end.not_to change(Conflict, :count)

      expect(response).to have_http_status(:success)
      expect(response.body).to include('End date must be in the future')
    end

    it 'repopulates the form with the submitted values on validation failure' do
      sign_in_as_member(season: season)
      pending_status

      post '/members/conflicts', params: conflict_form_params(
        start_at: 1.week.ago,
        end_at: 2.weeks.from_now,
        reason: 'A very distinctive reason for missing rehearsal'
      )

      expect(response.body).to include('A very distinctive reason for missing rehearsal')
    end

    # Regression: ConflictDateTimeField once rendered name="conflict[start_date]_date",
    # which Rails parses as a NESTED hash (conflict.start_date._date) — the
    # controller read conflict[:start_date_date] and saw blank, rejecting a
    # fully-filled form. Exercise the literal query string a browser sends.
    it 'accepts the flat conflict[start_date_date] param names a browser posts' do
      member = sign_in_as_member(season: season)
      pending_status
      d1 = 10.days.from_now.strftime('%Y-%m-%d')
      d2 = 11.days.from_now.strftime('%Y-%m-%d')
      body = "authenticity_token=x&conflict%5Bstart_date_date%5D=#{d1}" \
             '&conflict%5Bstart_date_time%5D=18%3A30' \
             "&conflict%5Bend_date_date%5D=#{d2}" \
             '&conflict%5Bend_date_time%5D=21%3A30&conflict%5Breason%5D=Closing+shift'

      expect do
        post '/members/conflicts', params: body,
                                   headers: { 'CONTENT_TYPE' => 'application/x-www-form-urlencoded' }
      end.to change(Conflict, :count).by(1)

      conflict = member.conflicts.last
      expect(conflict.start_date.strftime('%Y-%m-%d %H:%M')).to eq("#{d1} 18:30")
      expect(conflict.end_date.strftime('%Y-%m-%d %H:%M')).to eq("#{d2} 21:30")
    end
  end

  describe 'The "Already submitted" card on the new-conflict form' do
    it 'labels the card with the season and how many are already in' do
      member = sign_in_as_member(season: season)
      create_list(
        :conflict, 2,
        user: member, season: season, conflict_status: pending_status,
        start_date: 1.week.from_now, end_date: 8.days.from_now
      )

      get '/members/conflicts/new'

      expect(response.body).to include('Already submitted')
      expect(response.body).to match(/#{season.year} Season\s*·\s*2/)
    end

    it 'names the season but omits the count when nothing has been submitted' do
      sign_in_as_member(season: season)

      get '/members/conflicts/new'

      expect(response.body).to include("#{season.year} Season")
      expect(response.body).not_to match(/#{season.year} Season\s*·/)
    end
  end

  describe 'Conflict submission is closed for the season' do
    let(:closed_season) { create(:season, year: Date.today.year, conflict_submission_open: false) }

    it 'shows the closed state instead of the form' do
      sign_in_as_member(season: closed_season)

      get '/members/conflicts/new'

      expect(response).to have_http_status(:success)
      expect(response.body).to include("Conflicts aren't open right now")
    end

    it 'rejects a create via direct POST even when closed' do
      sign_in_as_member(season: closed_season)
      pending_status

      expect do
        post '/members/conflicts', params: conflict_form_params(
          start_at: 1.week.from_now, end_at: 2.weeks.from_now
        )
      end.not_to change(Conflict, :count)

      expect(response).to redirect_to(new_members_conflict_path)
      expect(flash[:error]).to match(/currently closed/)
    end
  end

  describe 'Coordinator approves a conflict' do
    let(:member) { create(:user) }
    let!(:conflict) do
      create(
        :conflict,
        user: member,
        season: season,
        conflict_status: pending_status,
        start_date: 1.week.from_now,
        end_date: 2.weeks.from_now
      )
    end

    before do
      create(:seasons_user, user: member, season: season, role: 'member')
      sign_in_as_coordinator(season: season)
    end

    it 'updates the conflict status to approved' do
      patch "/coordinators/conflicts/#{conflict.id}", params: {
        conflict: {
          status_id: approved_status.id
        }
      }

      conflict.reload
      expect(conflict.conflict_status).to eq(approved_status)
      expect(flash[:success]).to match(/updated/)
    end

    it 'updates conflict via API endpoint' do
      patch "/api/conflicts/#{conflict.id}", params: {
        conflict: {
          status_id: approved_status.id
        }
      }, as: :json

      conflict.reload
      expect(conflict.conflict_status).to eq(approved_status)
      expect(response).to have_http_status(:success)
    end

    it 'can create conflicts with past dates' do
      expect do
        post '/coordinators/conflicts', params: {
          conflict: {
            user_id: member.id,
            status_id: approved_status.id,
            start_date: 1.week.ago,
            end_date: 1.day.ago,
            reason: 'Retroactive conflict entry'
          }
        }
      end.to change(Conflict, :count).by(1)

      conflict = Conflict.last
      expect(conflict.start_date).to be < Time.current
      expect(flash[:success]).to match(/created/)
    end
  end

  describe 'Member views their conflicts' do
    let(:member) { sign_in_as_member(season: season) }
    let!(:payment_schedule) { create(:payment_schedule, user: member, season: season) }
    let!(:schedule_entry) do
      create(:payment_schedule_entry, payment_schedule: payment_schedule, pay_date: 1.week.from_now)
    end
    let!(:member_conflict) do
      create(
        :conflict,
        user: member,
        season: season,
        conflict_status: approved_status,
        start_date: 1.week.from_now,
        end_date: 8.days.from_now
      )
    end
    let!(:other_conflict) do
      other_user = create(:user)
      create(:seasons_user, user: other_user, season: season, role: 'member')
      create(:conflict, user: other_user, season: season)
    end

    it 'shows conflicts on member dashboard' do
      get '/members'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Your conflicts')
      # The summary lists the conflict by its start date
      expect(response.body).to include(member_conflict.start_date.strftime('%a %-m/%-d'))
    end

    it 'shows only the current member conflicts on the index page' do
      get '/members/conflicts'

      expect(response).to have_http_status(:success)
      expect(response.body).to include(member_conflict.start_date.strftime('%a %-m/%-d'))
    end
  end

  describe 'Admin can view and edit conflicts' do
    let(:member) { create(:user) }
    let!(:conflict) do
      create(:seasons_user, user: member, season: season, role: 'member')
      create(
        :conflict,
        user: member,
        season: season,
        conflict_status: pending_status
      )
    end

    before { sign_in_as_admin(season: season) }

    it 'can access conflicts index page' do
      get '/admin/conflicts'

      expect(response).to have_http_status(:success)
    end

    it 'can update conflicts via API' do
      patch "/api/conflicts/#{conflict.id}", params: {
        conflict: {
          status_id: approved_status.id
        }
      }, as: :json

      conflict.reload
      expect(conflict.conflict_status).to eq(approved_status)
      expect(response).to have_http_status(:success)
    end

    it 'can edit conflict page' do
      get "/admin/conflicts/#{conflict.id}/edit"

      expect(response).to have_http_status(:success)
    end

    it 'can create conflicts with past dates' do
      expect do
        post '/admin/conflicts', params: {
          conflict: {
            user_id: member.id,
            status_id: approved_status.id,
            start_date: 1.week.ago,
            end_date: 1.day.ago,
            reason: 'Retroactive conflict entry'
          }
        }
      end.to change(Conflict, :count).by(1)

      conflict = Conflict.last
      expect(conflict.start_date).to be < Time.current
      expect(flash[:success]).to match(/created/)
    end
  end

  describe 'Member edits their own pending conflict' do
    let(:member) { sign_in_as_member(season: season) }
    let!(:conflict) do
      create(
        :conflict,
        user: member,
        season: season,
        conflict_status: pending_status,
        start_date: 1.week.from_now,
        end_date: 8.days.from_now,
        reason: 'Original reason'
      )
    end

    before { allow(EmailService).to receive(:send_conflict_edited_email) }

    it 'shows the edit form prefilled with the conflict' do
      get "/members/conflicts/#{conflict.id}/edit"

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Original reason')
    end

    it 'updates the dates and reason' do
      patch "/members/conflicts/#{conflict.id}", params: conflict_form_params(
        start_at: 3.weeks.from_now, end_at: 22.days.from_now, reason: 'Updated reason'
      )

      conflict.reload
      expect(conflict.reason).to eq('Updated reason')
      expect(conflict.start_date.to_date).to eq(3.weeks.from_now.to_date)
      expect(response).to redirect_to(members_conflicts_path)
      expect(flash[:success]).to match(/updated/i)
    end

    it 'notifies coordinators and admins that the member changed it' do
      patch "/members/conflicts/#{conflict.id}", params: conflict_form_params(
        start_at: 3.weeks.from_now, end_at: 22.days.from_now, reason: 'Updated reason'
      )

      expect(EmailService).to have_received(:send_conflict_edited_email)
        .with(having_attributes(id: conflict.id), member, season.id)
    end

    it 'keeps the status and owner even when the params try to change them' do
      other_user = create(:user)

      patch "/members/conflicts/#{conflict.id}", params: {
        conflict: {
          start_date_date: 3.weeks.from_now.strftime('%Y-%m-%d'),
          start_date_time: '18:30',
          end_date_date: 22.days.from_now.strftime('%Y-%m-%d'),
          end_date_time: '21:30',
          reason: 'Updated reason',
          status_id: approved_status.id,
          user_id: other_user.id
        }
      }

      conflict.reload
      expect(conflict.conflict_status).to eq(pending_status)
      expect(conflict.user).to eq(member)
    end

    # The lock the canvas asks for is server-side, not just a disabled button.
    it 'refuses to edit a conflict that has already been decided' do
      decided = create(
        :conflict,
        user: member,
        season: season,
        conflict_status: approved_status,
        start_date: 1.week.from_now,
        end_date: 8.days.from_now,
        reason: 'Already approved'
      )

      patch "/members/conflicts/#{decided.id}", params: conflict_form_params(
        start_at: 3.weeks.from_now, end_at: 22.days.from_now, reason: 'Sneaky edit'
      )

      expect(decided.reload.reason).to eq('Already approved')
      expect(response).to redirect_to(members_conflicts_path)
      expect(flash[:error]).to match(/already been decided/)
    end

    it 'refuses to edit a conflict belonging to someone else' do
      other_user = create(:user)
      theirs = create(
        :conflict,
        user: other_user,
        season: season,
        conflict_status: pending_status,
        start_date: 1.week.from_now,
        end_date: 8.days.from_now,
        reason: 'Not yours'
      )

      patch "/members/conflicts/#{theirs.id}", params: conflict_form_params(
        start_at: 3.weeks.from_now, end_at: 22.days.from_now, reason: 'Sneaky edit'
      )

      expect(theirs.reload.reason).to eq('Not yours')
      expect(response).to redirect_to(members_conflicts_path)
      expect(flash[:error]).to match(/couldn't find/)
    end

    it 'rejects an edit whose end falls before its start' do
      patch "/members/conflicts/#{conflict.id}", params: conflict_form_params(
        start_at: 3.weeks.from_now, end_at: 2.weeks.from_now, reason: 'Backwards'
      )

      expect(conflict.reload.reason).to eq('Original reason')
      expect(response.body).to include('must be on or after the start date')
    end

    # Same regression guard as create: exercise the literal urlencoded body a
    # browser sends, so a wrong name= attribute can't hide behind a Ruby hash.
    it 'accepts the flat param names a browser posts' do
      d1 = 20.days.from_now.strftime('%Y-%m-%d')
      d2 = 21.days.from_now.strftime('%Y-%m-%d')
      body = "_method=patch&authenticity_token=x&conflict%5Bstart_date_date%5D=#{d1}" \
             '&conflict%5Bstart_date_time%5D=18%3A30' \
             "&conflict%5Bend_date_date%5D=#{d2}" \
             '&conflict%5Bend_date_time%5D=21%3A30&conflict%5Breason%5D=Closing+shift'

      patch "/members/conflicts/#{conflict.id}", params: body,
                                                 headers: { 'CONTENT_TYPE' => 'application/x-www-form-urlencoded' }

      conflict.reload
      expect(conflict.start_date.strftime('%Y-%m-%d %H:%M')).to eq("#{d1} 18:30")
      expect(conflict.reason).to eq('Closing shift')
    end
  end
end
