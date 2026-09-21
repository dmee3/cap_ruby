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

  it 'counts the season roster for the header summary' do
    3.times { member }
    create(:user).tap { |u| create(:seasons_user, user: u, season: season, role: 'staff') }

    get '/admin'

    expect(response.body).to include('3 members')
  end

  it 'leads the blank-schedule meta with the member type, then the section' do
    m = create(:user, first_name: 'Marcus', last_name: 'Vale')
    create(:seasons_user, user: m, season: season, role: 'member', ensemble: 'World', section: 'Snare')
    create(:payment_schedule, season: season, user: m) # no entries — blank

    get '/admin'

    expect(response.body).to include('New member · World / Snare')
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

  describe 'the last-Venmo bookmark' do
    let(:venmo) { create(:payment_type, name: 'Venmo') }

    it 'reports the most recently entered Venmo payment with its member and amount' do
      m = member(first_name: 'Jordan', last_name: 'Pike')
      create(:payment, user: m, season: season, payment_type: venmo,
                       amount: 40_000, date_paid: Date.current - 3.days)

      get '/admin'

      bookmark = response.body[/data-last-venmo="[^"]*"/]
      expect(bookmark).to include('Jordan Pike')
      expect(bookmark).to include('&quot;amount_cents&quot;:40000')
      expect(bookmark).to include('&quot;date_paid&quot;')
    end

    it 'picks the latest entry rather than the latest payment date' do
      m = member
      create(:payment, user: m, season: season, payment_type: venmo,
                       amount: 11_100, date_paid: Date.current - 1.day, created_at: 10.days.ago)
      create(:payment, user: m, season: season, payment_type: venmo,
                       amount: 22_200, date_paid: Date.current - 30.days, created_at: 1.hour.ago)

      get '/admin'

      bookmark = response.body[/data-last-venmo="[^"]*"/]
      expect(bookmark).to include('&quot;amount_cents&quot;:22200')
      expect(bookmark).not_to include('&quot;amount_cents&quot;:11100')
    end

    it 'ignores payments made by any other method' do
      m = member
      create(:payment, user: m, season: season, amount: 33_300, date_paid: Date.current)

      get '/admin'

      expect(response.body).to include('data-last-venmo="null"')
    end

    it 'counts the days since entry, not since the payment date' do
      m = member
      create(:payment, user: m, season: season, payment_type: venmo,
                       amount: 40_000, date_paid: Date.current - 60.days, created_at: 20.days.ago)

      get '/admin'

      expect(response.body[/data-last-venmo="[^"]*"/]).to include('&quot;entered_days_ago&quot;:20')
    end

    it 'says there is nothing to bookmark before the Venmo type even exists' do
      get '/admin'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('data-last-venmo="null"')
    end

    it 'points at the add-payment form with Venmo preselected' do
      get '/admin'

      expect(response.body).to include('payment_type=Venmo')
    end
  end
end
