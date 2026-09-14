# frozen_string_literal: true

# The public calendar fundraiser.
#
# The mechanic, in one line: the donation amount IS the date number. Sponsoring
# the 3rd is a $3 donation, the 17th is $17. There are 31 dates per performer,
# each claimable once, so a finished calendar raises 1+2+...+31 = $496.
module Fundraiser
  # The dates a donor can sponsor. The month is always March (see
  # CalendarMailer, which formats a donated date as "3/<day>"), but no
  # donor-facing copy says so: the tiles are prices, not appointments, so the
  # grid carries no month name and no weekday alignment.
  TOTAL_DATES = 31

  # 1+2+...+31. Mirrors Calendar::Fundraiser::TOTAL_MARCH_DATES, which is the
  # model-side source of truth.
  COMPLETE_DOLLARS = Calendar::Fundraiser::TOTAL_MARCH_DATES

  # Donors have no season context: they arrive from a shared link, never signed
  # in, so there is no `current_season` for them (and no `Season.current` in
  # this app at all). The newest season is the only sensible answer.
  #
  # Ordered by year rather than `Season.last`'s `ORDER BY id`, which is correct
  # today only because id order happens to match year order. A back-filled
  # historical season would silently redirect every public donation into the
  # wrong year.
  def self.public_season
    Season.order(:year).last
  end
end
