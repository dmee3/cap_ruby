# frozen_string_literal: true

module Auditions
  class AddressParser
    # Squarespace's native Address form field renders as a single comma-separated
    # string, e.g.:
    #   "2062 Shetland St, Marysville, OH 43040 US"
    #   "123 Main St, Columbus, OH 43215"
    # The last segment holds state (+ optional zip/country); the segment before
    # it is the city. We only care about pulling city/state back out of it.
    STATE_SEGMENT = /\A\s*(?<state>[A-Za-z .]+?)\s*(?:\d{5}(?:-\d{4})?)?\s*(?:[A-Za-z]{2,})?\s*\z/.freeze

    class << self
      def parse(address)
        return { city: '', state: '' } if address.blank?

        segments = address.to_s.split(',').map(&:strip).reject(&:blank?)
        return { city: '', state: '' } if segments.size < 2

        state_match = STATE_SEGMENT.match(segments.last)
        return { city: '', state: '' } unless state_match

        {
          city: segments[-2].to_s.strip.titleize,
          state: StateConverterService.abbreviation(state_match[:state].to_s.strip)
        }
      end
    end
  end
end
