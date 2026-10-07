# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DefaultSchedules::SeasonCard do
  let(:season) { create(:season, year: '2027') }

  def card
    described_class.call(DefaultSchedules::Overview.call(season))
  end

  def member(ensemble:, section:, vet: false)
    create(:user).tap do |u|
      create(:seasons_user, user: u, season: create(:season, year: '2020'), role: 'member') if vet
      create(:seasons_user, user: u, season: season, role: 'member', ensemble: ensemble, section: section)
    end
  end

  it 'leads with the people left without a schedule when nothing is set up' do
    2.times { member(ensemble: 'World', section: 'Snare') }

    expect(card).to include(tone: 'danger', pill: '0 of 8', headline: '2 members have no payment schedule')
  end

  it 'names the one ensemble and section group that is missing, split by vet status' do
    seed_default_schedules(season)
    DefaultScheduleEntry.where(season: season, ensemble: 'CC2', section_group: 'Visual').delete_all
    member(ensemble: 'CC2', section: 'Visual', vet: true)
    member(ensemble: 'CC2', section: 'Visual')

    expect(card).to include(
      tone: 'warning', pill: '6 of 8', headline: "CC2 · Visual isn't set up",
      body: '2 members (1 Vet, 1 Rookie) have no payment schedule.'
    )
  end

  it 'keeps warning once every default exists if members still have empty schedules' do
    seed_default_schedules(season)
    member(ensemble: 'World', section: 'Snare')

    expect(card).to include(tone: 'warning', headline: '1 member still has an empty schedule')
  end

  it 'summarises the range and dates once everything is in place' do
    seed_default_schedules(season)

    expect(card).to include(
      tone: 'neutral', headline: 'All 8 set up for 2027',
      body: '$1,700 to $2,500 per member · 6 payments, 10/17/25 – 3/6/26'
    )
  end
end
