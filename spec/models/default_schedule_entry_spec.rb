# frozen_string_literal: true

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
