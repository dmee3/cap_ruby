# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin::Users season removal', type: :request do
  let(:season) { create(:season, year: '2026') }
  let!(:admin) { sign_in_as_admin(season: season) }

  let(:member) do
    create(:user, first_name: 'Gus', last_name: 'Halloway').tap do |u|
      create(:seasons_user, user: u, season: season, role: 'member', ensemble: 'World', section: 'Snare')
      schedule = create(:payment_schedule, user: u, season: season)
      2.times do |i|
        create(:payment_schedule_entry, payment_schedule: schedule, amount: 50_000,
                                        pay_date: Date.new(2025, 10, 1) + (i * 30))
      end
      create(:payment, user: u, season: season, amount: 20_000)
    end
  end

  # Param-shape guard: the form posts indexed rows, so a Ruby-hash spec would
  # pass even if the name= attributes were wrong. Post a literal body.
  def toggle_off_body(row)
    [
      'user[first_name]=Gus',
      'user[last_name]=Halloway',
      "user[seasons_users_attributes][0][id]=#{row.id}",
      "user[seasons_users_attributes][0][season_id]=#{season.id}",
      'user[seasons_users_attributes][0][_destroy]=1'
    ].join('&')
  end

  describe 'toggling a season off' do
    it 'marks the membership removed instead of deleting the row' do
      row = member.seasons_users.first

      patch "/admin/users/#{member.id}",
            params: toggle_off_body(row),
            headers: { 'CONTENT_TYPE' => 'application/x-www-form-urlencoded' }

      expect(response).to have_http_status(:found)
      expect(row.reload.role).to eq('removed')
      expect(member.reload.seasons_users.count).to eq(1)
    end

    it 'settles the dues at what was already paid, so nothing is left unowed' do
      row = member.seasons_users.first

      patch "/admin/users/#{member.id}",
            params: toggle_off_body(row),
            headers: { 'CONTENT_TYPE' => 'application/x-www-form-urlencoded' }

      expect(member.reload.payment_schedule_for(season.id).entries.sum(&:amount)).to eq(20_000)
      expect(PaymentService.amount_owed_on_date(member, Date.current, season.id)).to eq(0.0)
    end

    it 'takes them off the roster without touching their payments' do
      row = member.seasons_users.first

      patch "/admin/users/#{member.id}",
            params: toggle_off_body(row),
            headers: { 'CONTENT_TYPE' => 'application/x-www-form-urlencoded' }

      expect(User.members_for_season(season.id)).not_to include(member)
      expect(member.reload.amount_paid_for(season.id)).to eq(20_000)
    end
  end

  describe 'GET /api/admin/users' do
    it 'flags the removed row so the roster can grey it out' do
      SeasonRemovalService.remove(member, season.id)

      get '/api/admin/users'

      row = response.parsed_body.find { |r| r['id'] == member.id }
      expect(row['removed']).to be(true)
    end
  end
end
