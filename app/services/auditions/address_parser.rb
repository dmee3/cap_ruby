# frozen_string_literal: true

module Auditions
  class AddressParser
    # Squarespace's native Address form field renders as a multi-line string, e.g.:
    #   "123 Main St\nColumbus, OH 43215\nUnited States"
    # We only care about pulling city/state back out of it.
    CITY_STATE_LINE = /\A\s*(?<city>[^,]+),\s*(?<state>[A-Za-z .]+?)\s*(?:\d{5}(?:-\d{4})?)?\s*\z/.freeze

    class << self
      def parse(address)
        return { city: '', state: '' } if address.blank?

        line = city_state_line(address)
        return { city: '', state: '' } unless line

        match = CITY_STATE_LINE.match(line)
        return { city: '', state: '' } unless match

        {
          city: match[:city].to_s.strip.titleize,
          state: StateConverterService.abbreviation(match[:state].to_s.strip)
        }
      end

      private

      # The city/state/zip line is usually the second line, but fall back to
      # scanning every line in case the street address is missing.
      def city_state_line(address)
        lines = address.to_s.split("\n").map(&:strip).reject(&:blank?)
        lines.find { |l| l.match?(CITY_STATE_LINE) }
      end
    end
  end
end
