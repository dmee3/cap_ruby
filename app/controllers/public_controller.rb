# frozen_string_literal: true

# Base class for routes with an external, unauthenticated audience — the
# auditions spreadsheet page, the standalone tools, the public calendar
# fundraiser. These render the shell-free `public` layout: no sidebar, no
# season switcher, nothing that assumes a `current_user`.
#
# Inherit from this (not ApplicationController) for any page a logged-out
# visitor can reach, so the layout choice is declared, not inferred from
# whether someone happens to be signed in.
class PublicController < ApplicationController
  layout 'public'

  private

  # Donors have no season context — they're never signed in, so
  # `current_season` (cookie-based, keyed off `current_user`) returns nil here.
  # The newest season is the only sensible answer for a public page.
  def public_season
    @public_season ||= Fundraiser.public_season
  end

  # "Spring 2026". A season's `year` is its ending year, and the competitive
  # season runs fall to spring, so the public label names the spring everyone
  # is actually pointing at.
  def season_label
    return nil if public_season.blank?

    "Spring #{public_season.year}"
  end
end
