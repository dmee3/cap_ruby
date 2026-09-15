# frozen_string_literal: true

module Fundraiser
  # "the 3rd", "the 3rd and 12th", "the 3rd, 12th and 17th".
  #
  # The server-side twin of `utilities/ordinals.ts`. Both exist because the
  # confirmation sentence is rendered in ERB while the picker builds the same
  # phrase in React, and a donor shouldn't see the dates described two
  # different ways on two consecutive screens.
  module DateList
    SUFFIXES = { 1 => 'st', 2 => 'nd', 3 => 'rd' }.freeze

    def self.ordinal(number)
      # 11th, 12th and 13th are the exceptions a bare last-digit rule misses.
      return "#{number}th" if (11..13).cover?(number % 100)

      "#{number}#{SUFFIXES.fetch(number % 10, 'th')}"
    end

    # Only the first date takes "the", so the list reads the way someone would
    # say it out loud. No serial comma, matching the rest of the copy.
    def self.call(dates)
      ordinals = Array(dates).sort.map { |date| ordinal(date) }
      return '' if ordinals.empty?
      return "the #{ordinals.first}" if ordinals.one?

      "the #{ordinals[0..-2].join(', ')} and #{ordinals.last}"
    end
  end
end
