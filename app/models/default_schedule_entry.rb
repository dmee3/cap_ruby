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
# One dated amount in a season's default payment schedule for one combination
# of ensemble, section group and vet status. A member's schedule is copied from
# the rows matching them when they join a season.
class DefaultScheduleEntry < ApplicationRecord
  SECTION_GROUPS = %w[Music Visual].freeze
  VET_STATUSES = %w[Vet Rookie].freeze

  belongs_to :season

  validates :ensemble, inclusion: { in: SeasonsUser::ENSEMBLES }
  validates :section_group, inclusion: { in: SECTION_GROUPS }
  validates :vet_status, inclusion: { in: VET_STATUSES }
  validates :pay_date, presence: true,
                       uniqueness: { scope: %i[season_id ensemble section_group vet_status] }
  validates :amount_cents, numericality: { only_integer: true, greater_than: 0 }

  # There is no battery group: every section but Visual pays the Music rate.
  def self.section_group_for(section)
    section == 'Visual' ? 'Visual' : 'Music'
  end

  def self.vet_status_for(vet)
    vet ? 'Vet' : 'Rookie'
  end
end
