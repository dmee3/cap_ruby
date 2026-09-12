# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Flash rendering', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:pending_status) { create(:conflict_status, name: 'Pending') }

  before do
    allow(ActivityLogger).to receive(:log_conflict)
    allow(EmailService).to receive(:send_conflict_submitted_email)
  end

  def submit_conflict
    post '/members/conflicts', params: {
      conflict: {
        start_date_date: 1.week.from_now.strftime('%Y-%m-%d'),
        start_date_time: '09:00',
        end_date_date: 1.week.from_now.strftime('%Y-%m-%d'),
        end_date_time: '17:00',
        reason: 'Family wedding'
      }
    }
  end

  describe 'a flash carrying a real message' do
    it 'renders exactly one toast row in the flash bar' do
      user = sign_in_as_member(season: season)

      post '/settings', params: { username: "#{user.username}_renamed", email: user.email }
      follow_redirect! while response.redirect?

      expect(response.body).to include('flash-bar')
      expect(response.body.scan('class="flash ').size).to eq(1)
    end
  end

  describe 'submitting a conflict' do
    it 'answers inline only, with no duplicate toast' do
      sign_in_as_member(season: season)
      pending_status

      submit_conflict
      follow_redirect! while response.redirect?

      expect(response.body).to include('Sent. Your coordinators see it now.')
      expect(response.body).not_to include('Conflict submitted for review.')
    end

    it 'renders no empty flash bar for a signal-only flash key' do
      sign_in_as_member(season: season)
      pending_status

      submit_conflict
      follow_redirect! while response.redirect?

      expect(response.body).not_to include('flash-bar')
    end
  end
end
