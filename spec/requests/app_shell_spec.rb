# frozen_string_literal: true

require 'rails_helper'

# Guards the single role-driven app shell (UX overhaul PR 1, phase D).
RSpec.describe 'App shell', type: :request do
  let(:season) { create(:season, year: Date.today.year) }

  before do
    allow(EventService).to receive(:next_event).and_return(nil)
    allow(PaymentService).to receive(:amount_owed_on_date).and_return(0)
    allow(PaymentService).to receive(:total_dues_owed_to_date).and_return(0)
    allow(PaymentService).to receive(:total_dues_paid_to_date).and_return(0)
  end

  shared_examples 'renders the shell' do |path|
    it "renders the unified shell at #{path}" do
      get path

      expect(response).to have_http_status(:success)
      expect(response.body).to include('class="app-sidebar"')
      expect(response.body).to include('app-drawer')
      expect(response.body).to include('data-dropdown-trigger') # season switcher / profile menu
      # legacy chrome is gone
      expect(response.body).not_to include('id="sidebar"')
      expect(response.body).not_to include('id="mobile-menu-btn"')
    end
  end

  describe 'admin' do
    before { sign_in_as_admin(season: season) }
    include_examples 'renders the shell', '/admin'

    it 'shows the admin nav items' do
      get '/admin'
      %w[Home Users Payments Conflicts Files Inventory Emails Calendars].each do |label|
        expect(response.body).to include(">#{label}<")
      end
    end
  end

  describe 'coordinator' do
    before { sign_in_as_coordinator(season: season) }
    include_examples 'renders the shell', '/coordinators'
  end

  describe 'staff' do
    before { sign_in_as_staff(season: season) }
    include_examples 'renders the shell', '/staff'
  end

  describe 'member' do
    let!(:member) { sign_in_as_member(season: season) }
    let!(:schedule) { create(:payment_schedule, user: member, season: season) }
    before do
      create(:payment_schedule_entry, payment_schedule: schedule, amount: 30_000, pay_date: 1.week.from_now)
    end

    include_examples 'renders the shell', '/members'

    it 'shows the member nav items' do
      get '/members'
      ['Home', 'Pay Dues', 'See Conflicts', 'Files', 'My Fundraisers'].each do |label|
        expect(response.body).to include(">#{label}<")
      end
    end
  end

  describe 'nav active state' do
    let(:category) { create(:inventory_category) }

    before { sign_in_as_admin(season: season) }

    # The nav renders twice, once in the sidebar and once in the mobile drawer,
    # so the one active item legitimately produces two marked rows. Asserting
    # the raw list rather than uniq'ing it keeps a second active item visible.
    def active_labels
      response.body
              .scan(/sidebar-link--active[^>]*>.*?<span class="text-body-sm">([^<]+)</m)
              .flatten
    end

    it 'marks exactly one item active on a nested route' do
      get "/inventory/categories/#{category.id}/items/new"

      expect(active_labels).to eq(%w[Inventory Inventory])
    end

    it 'keeps the home item inactive on a child route' do
      get '/admin/users'

      expect(active_labels).to eq(%w[Users Users])
    end

    it 'activates the email rules item on its own page' do
      get '/inventory/email_rules'

      expect(active_labels).to eq(%w[Emails Emails])
    end

    it 'activates home only on the dashboard itself' do
      get '/admin'

      expect(active_labels).to eq(%w[Home Home])
    end
  end

  describe 'inventory access is a grant, not a role' do
    it 'gives a quartermaster on the staff roster an inventory link' do
      user = sign_in_as_staff(season: season)
      user.update!(inventory_access: true)

      get '/staff'

      expect(response.body).to include('>Inventory<')
    end

    it 'leaves the link out for staff without the grant' do
      sign_in_as_staff(season: season)

      get '/staff'

      expect(response.body).not_to include('>Inventory<')
    end
  end

  describe 'Devise pages use the auth layout, not the shell' do
    it 'renders /login without the shell' do
      get '/login'

      expect(response).to have_http_status(:success)
      expect(response.body).not_to include('class="app-sidebar"')
      expect(response.body).to include('max-w-sm') # centered auth card
    end
  end
end
