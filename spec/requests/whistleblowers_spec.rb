# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Whistleblowers', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:user) { create(:user) }
  let(:dana) { create(:user, first_name: 'Dana', last_name: 'Reyes', whistleblower_recipient: true) }
  let(:juli) { create(:user, first_name: 'Juli', last_name: 'Navarro', whistleblower_recipient: true) }
  let(:nikki) { create(:user, first_name: 'Nikki', last_name: 'Park', whistleblower_recipient: true) }
  let(:recipient_ids) { [dana.id, juli.id, nikki.id] }

  before do
    create(:seasons_user, user: user, season: season, role: 'member')
    allow(PostOffice).to receive(:send_email)
  end

  def sign_in_and_visit
    sign_in user
    cookies[:cap_season_id] = season.id
  end

  describe 'GET /whistleblowers' do
    it 'redirects an unauthenticated visitor to login' do
      get '/whistleblowers'

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'offers the flagged recipients and the rule they carry' do
      recipient_ids
      sign_in_and_visit

      get '/whistleblowers'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Dana Reyes')
      expect(response.body).to include('&quot;minimum&quot;:3')
    end

    it 'does not offer someone who is not flagged' do
      recipient_ids
      create(:user, first_name: 'Unflagged', last_name: 'Person')
      sign_in_and_visit

      get '/whistleblowers'

      expect(response.body).not_to include('Unflagged Person')
    end

    # No backfill by design, so this is the state on the day the flag ships.
    it 'says so rather than offering an empty picker when nobody is set up' do
      sign_in_and_visit

      get '/whistleblowers'

      expect(response.body).to include('&quot;recipients&quot;:[]')
      expect(response.body).to include('&quot;minimum&quot;:0')
    end
  end

  describe 'POST /whistleblowers' do
    it 'redirects an unauthenticated visitor to login' do
      post '/whistleblowers', params: { email: 'r@example.com', report: 'x', recipients: recipient_ids }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'sends the report to everyone picked' do
      sign_in_and_visit

      post '/whistleblowers', params: {
        email: 'reporter@example.com',
        report: 'This is a report.',
        recipients: recipient_ids
      }

      expect(PostOffice).to have_received(:send_email) do |addresses, subject, text|
        expect(addresses).to match_array([dana.email, juli.email, nikki.email])
        expect(subject).to eq('Whistleblower Report')
        expect(text).to include('This is a report.')
      end
      expect(response).to redirect_to(sent_whistleblowers_path)
    end

    it 'sends anonymously when no contact address is given' do
      sign_in_and_visit

      post '/whistleblowers', params: {
        email: '', report: 'Anonymous report', recipients: recipient_ids
      }

      expect(PostOffice).to have_received(:send_email) do |_addresses, _subject, text|
        expect(text).to include('(Anonymous)')
      end
    end

    # The submitter is signed in, so their identity is available throughout and
    # has to be deliberately unused.
    it 'never carries the signed-in identity into the mail' do
      sign_in_and_visit

      post '/whistleblowers', params: {
        email: '', report: 'Anonymous report', recipients: recipient_ids
      }

      expect(PostOffice).to have_received(:send_email) do |_addresses, _subject, text|
        expect(text).not_to include(user.email)
        expect(text).not_to include(user.username.to_s)
        expect(text).not_to include(user.full_name)
      end
    end

    it 'refuses a group smaller than the minimum' do
      recipient_ids
      sign_in_and_visit

      post '/whistleblowers', params: {
        email: 'r@example.com', report: 'Test', recipients: [dana.id, juli.id]
      }

      expect(PostOffice).not_to have_received(:send_email)
      expect(response).to have_http_status(:success)
      expect(flash[:error]).to include('at least 3')
    end

    it 'refuses when no recipients are picked at all' do
      recipient_ids
      sign_in_and_visit

      post '/whistleblowers', params: { email: 'r@example.com', report: 'Test', recipients: nil }

      expect(PostOffice).not_to have_received(:send_email)
      expect(flash[:error]).to include('at least 3')
    end

    it 'refuses to send anything when nobody is set up to receive' do
      sign_in_and_visit

      post '/whistleblowers', params: { email: 'r@example.com', report: 'Test', recipients: [] }

      expect(PostOffice).not_to have_received(:send_email)
      expect(flash[:error]).to include('Nobody is set up')
    end

    # A pool of two means "at least three" can never be satisfied, so the floor
    # is the pool and the report still goes out.
    it 'accepts the whole pool when fewer than three people are flagged' do
      dana
      juli
      sign_in_and_visit

      post '/whistleblowers', params: {
        email: 'r@example.com', report: 'Test', recipients: [dana.id, juli.id]
      }

      expect(PostOffice).to have_received(:send_email)
      expect(response).to redirect_to(sent_whistleblowers_path)
    end

    context 'when a picked recipient cannot be reached' do
      it 'sends to nobody and says so' do
        recipient_ids
        allow(EmailService).to receive(:send_whistleblower_email)
          .and_raise(EmailService::UndeliverableReport, 'report would reach 2 of 3')
        sign_in_and_visit

        post '/whistleblowers', params: {
          email: 'r@example.com', report: 'Test', recipients: recipient_ids
        }

        expect(response).to have_http_status(:success)
        expect(flash[:error]).to include("didn't send it at all")
      end
    end

    context 'when the mail path blows up' do
      before do
        allow(EmailService).to receive(:send_whistleblower_email).and_raise(StandardError, 'boom')
        allow(Rails.logger).to receive(:error)
        allow(Rollbar).to receive(:error)
      end

      it 'reports the failure without naming the reporter' do
        recipient_ids
        sign_in_and_visit

        post '/whistleblowers', params: {
          email: 'r@example.com', report: 'Something sensitive', recipients: recipient_ids
        }

        expect(Rollbar).to have_received(:error).with(anything, hash_including(user: nil))
        expect(response).to have_http_status(:success)
        expect(flash[:error]).to include('system has encountered an error')
      end

      it 'keeps the report body out of the log' do
        recipient_ids
        sign_in_and_visit

        post '/whistleblowers', params: {
          email: 'r@example.com', report: 'Something sensitive', recipients: recipient_ids
        }

        expect(Rails.logger).not_to have_received(:error).with(/Something sensitive/)
      end
    end

    %w[staff coordinator admin].each do |role|
      it "lets a #{role} submit a report" do
        other = create(:user)
        create(:seasons_user, user: other, season: season, role: role)
        recipient_ids
        sign_in other
        cookies[:cap_season_id] = season.id

        post '/whistleblowers', params: {
          email: "#{role}@example.com", report: 'Report', recipients: recipient_ids
        }

        expect(PostOffice).to have_received(:send_email)
        expect(response).to redirect_to(sent_whistleblowers_path)
      end
    end
  end

  describe 'GET /whistleblowers/sent' do
    it 'names who received it and whether a reply is possible' do
      sign_in_and_visit

      post '/whistleblowers', params: {
        email: 'r@example.com', report: 'Test', recipients: recipient_ids
      }
      follow_redirect!

      expect(response.body).to include('Your report is sent')
      expect(response.body).to include('Dana Reyes')
      expect(response.body).to include('get back to you within a week')
    end

    it 'says no reply is possible after an anonymous report' do
      sign_in_and_visit

      post '/whistleblowers', params: { email: '', report: 'Test', recipients: recipient_ids }
      follow_redirect!

      expect(response.body).to include('sent this anonymously')
    end

    # A confirmation rebuildable from a URL is a shareable record of who
    # reported something.
    it 'never echoes the report back' do
      sign_in_and_visit

      post '/whistleblowers', params: {
        email: 'r@example.com', report: 'The unmistakable report body', recipients: recipient_ids
      }
      follow_redirect!

      expect(response.body).not_to include('The unmistakable report body')
      expect(request.fullpath).not_to include('report')
    end

    it 'sends someone who arrives without having submitted back to the form' do
      sign_in_and_visit

      get '/whistleblowers/sent'

      expect(response).to redirect_to(whistleblowers_path)
    end
  end
end
