# frozen_string_literal: true

# == Schema Information
#
# Table name: default_schedule_entries
#
#  id            :integer          not null, primary key
#  amount_cents  :integer          not null
#  ensemble      :string           not null
#  pay_date      :date             not null
#  section_group :string           not null
#  vet_status    :string           not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  season_id     :integer          not null
#
# Indexes
#
#  index_default_schedule_entries_on_combination_and_date  (season_id,ensemble,section_group,vet_status,pay_date) UNIQUE
#  index_default_schedule_entries_on_season_id             (season_id)
#
# Foreign Keys
#
#  season_id  (season_id => seasons.id)
#
require 'rails_helper'

RSpec.describe DefaultScheduleEntry do
  describe '.section_group_for' do
    it 'puts Visual in its own group and every other section, battery included, in Music' do
      groups = Admin::UserFormPresenter::SECTIONS.index_with { |s| described_class.section_group_for(s) }

      expect(groups.select { |_, g| g == 'Visual' }.keys).to eq(['Visual'])
      expect(groups.except('Visual').values.uniq).to eq(['Music'])
    end
  end
end
