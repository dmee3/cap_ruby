# frozen_string_literal: true

# == Schema Information
#
# Table name: seasons_users
#
#  id        :integer          not null, primary key
#  ensemble  :string
#  role      :string
#  section   :string
#  season_id :integer
#  user_id   :integer
#
# Indexes
#
#  index_seasons_users_on_season_id  (season_id)
#  index_seasons_users_on_user_id    (user_id)
#
class SeasonsUser < ApplicationRecord
  # The roles an admin can assign. Deliberately excludes REMOVED_ROLE: the role
  # dropdown is built from this list, and removal is an action with its own
  # side effects (see SeasonRemovalService), not something to pick from a menu.
  ROLES = %w[member staff coordinator admin].freeze

  # Someone taken off a season's roster mid-season. The row stays so the season
  # keeps a record of them, so their dues stop where they were, and so the
  # people-facing screens can say "removed" rather than going quiet.
  REMOVED_ROLE = 'removed'

  # Excluded rather than included: legacy rows carry roles this app never
  # assigns ('None', or none at all), and they are still real memberships.
  # Whitelisting ROLES here would quietly strip a season from those people.
  scope :active, -> { where.not(role: REMOVED_ROLE) }

  belongs_to :season
  belongs_to :user

  # One row per person per season. Without this, a nested update that omits the
  # row's id silently creates a SECOND row for the same season, and every
  # role_for / section_for / ensemble_for lookup takes `.first` — so which role
  # wins comes down to row order.
  validates :user_id, uniqueness: { scope: :season_id }

  # NB: deliberately NOT validating role presence/inclusion. Legacy rows carry
  # the literal role 'None', and assigning `user.seasons = [season]` creates a
  # row with no role at all. The form is what guards this instead: the season
  # role block preselects Member when a season is toggled on.

  def removed?
    role == REMOVED_ROLE
  end
end
