# frozen_string_literal: true

module Fundraiser
  # Donor-facing names for the ensemble and section values `seasons_users`
  # stores. A parent recognises "Front Ensemble · Vibes"; the internal "CC2" and
  # the short section codes mean nothing to them.
  #
  # Anything unmapped passes through unchanged, so a new section added to a
  # roster shows its stored name rather than disappearing from the page.
  module DisplayLabels
    ENSEMBLES = {
      'World' => 'World',
      'CC2' => 'Cap City 2'
    }.freeze

    SECTIONS = {
      'Battery' => 'Battery',
      'Visual' => 'Visual',
      'Snare' => 'Snare',
      'Tenors' => 'Tenors',
      'Bass' => 'Bass',
      'Cymbals' => 'Cymbals',
      'Front Ensemble' => 'Front Ensemble',
      'Electronics' => 'Electronics'
    }.freeze

    def self.ensemble(value)
      return nil if value.blank?

      ENSEMBLES.fetch(value, value)
    end

    def self.section(value)
      return nil if value.blank?

      SECTIONS.fetch(value, value)
    end

    # "World · Snare", or just the half that exists. Returns nil when neither
    # does, so a caller can omit the line rather than render a stray separator.
    def self.combined(ensemble:, section:)
      [ensemble(ensemble), section(section)].compact_blank.join(' · ').presence
    end
  end
end
