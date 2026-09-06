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
end
