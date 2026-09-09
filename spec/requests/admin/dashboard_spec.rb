# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin::Dashboard', type: :request do
  let(:season) { create(:season, year: '2026') }
  let!(:admin) { sign_in_as_admin(season: season) }

  before { allow(EventService).to receive(:next_event).and_return(nil) }

  def member(**attrs)
    create(:user, **attrs).tap { |u| create(:seasons_user, user: u, season: season, role: 'member') }
  end

  it 'renders the burndown, stats, and list islands as JSON data attributes' do
    m = member(first_name: 'Behind', last_name: 'Betty')
    schedule = create(:payment_schedule, season: season, user: m)
    create(:payment_schedule_entry, payment_schedule: schedule, pay_date: Date.current - 5.days, amount: 30_000)
    create(:payment, user: m, season: season, amount: 10_000, date_paid: Date.current - 2.days)

    get '/admin'

    expect(response).to have_http_status(:success)
    %w[data-stats data-burndown data-behind-members data-recent-payments
       data-blank-schedule-members data-conflicts-to-review].each do |attr|
      expect(response.body).to include(attr)
    end
    expect(response.body).to include('Behind Betty')
  end

  it 'lists only pending, still-upcoming conflicts in the review island' do
    m = member
    pending = create(:conflict_status, name: 'Pending')
    approved = create(:conflict_status, name: 'Approved')
    create(:conflict, user: m, season: season, conflict_status: pending,
                      start_date: 5.days.from_now, end_date: 6.days.from_now, reason: 'Wedding')
    create(:conflict, user: m, season: season, conflict_status: approved,
                      start_date: 7.days.from_now, end_date: 8.days.from_now, reason: 'Approved trip')

    get '/admin'

    body = response.body
    expect(body).to include('Wedding')
    expect(body).not_to include('Approved trip')
  end

  it 'excludes soft-deleted payments from the recent-payments island' do
    m = member(first_name: 'Paid', last_name: 'Pat')
    create(:payment, user: m, season: season, amount: 12_300, date_paid: Date.current - 1.day)
    gone = create(:payment, user: m, season: season, amount: 99_900, date_paid: Date.current - 1.day)
    gone.destroy

    get '/admin'

    expect(response.body).to include('12300')
    expect(response.body).not_to include('99900')
  end
end
