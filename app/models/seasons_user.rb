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

  # Excluding the one role that means "not on this roster" rather than
  # whitelisting ROLES: a row carrying anything else is a real membership, and a
  # whitelist would silently drop a season from anyone whose role this app
  # stopped assigning.
  scope :active, -> { where.not(role: REMOVED_ROLE) }

  belongs_to :season
  belongs_to :user

  # One row per person per season. Without this, a nested update that omits the
  # row's id silently creates a SECOND row for the same season, and every
  # role_for / section_for / ensemble_for lookup takes `.first` — so which role
  # wins comes down to row order.
  validates :user_id, uniqueness: { scope: :season_id }

  # NB: deliberately NOT validating role presence/inclusion. `user.seasons =
  # [season]` builds a row with no role at all, so a validation here would turn
  # that assignment into a failed save rather than the membership it reads as.
  # The form guards it instead: the season role block preselects Member when a
  # season is toggled on.

  def removed?
    role == REMOVED_ROLE
  end
end
