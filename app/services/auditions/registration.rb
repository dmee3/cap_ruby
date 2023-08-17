# frozen_string_literal: true

module Auditions
  class Registration
    attr_reader :type, :name, :email, :city, :state, :instrument, :date, :experience, :birthdate

    PRODUCT_NAMES = [
      'CC24 Music Ensemble Audition Registration',
      'CC24 Visual Ensemble Audition Registration'
    ].freeze

    TYPE_MAP = {
      'CC24 Music Ensemble Audition Registration' => 'Music Registration',
      'CC24 Visual Ensemble Audition Registration' => 'Visual Registration'
    }.freeze

    FIELD_TO_SYMBOL = {
      'Name' => :name,
      'Email' => :email,
      'City' => :city,
      'State' => :state,
      'Preferred Pronouns' => :pronouns,
      'Shoe Size' => :shoe_size,
      'Shirt Size' => :shirt_size,
      'Primary Instrument' => :instrument,
      'Birthdate' => :birthdate,
      'Experience' => :experience,
      'Known Conflicts' => :conflicts
    }.freeze

    class << self
      def header_row
        ['Name', 'Email', 'City', 'State', 'Pronouns', 'Shoe', 'Shirt', 'Birthdate', 'Purchased', 'Experience', 'Conflicts']
      end
    end

    # rubocop:disable Metrics/AbcSize
    def initialize(args)
      @type = TYPE_MAP[args[:type]]
      @date = args[:date] - 4.hours

      @name = args[:name]
      @email = args[:email]
      @city = args[:city]&.titleize
      @state = args[:state] ? StateConverterService.abbreviation(args[:state]) : ''
      @pronouns = args[:pronouns]
      @shoe_size = args[:shoe_size]
      @shirt_size = args[:shirt_size]
      @instrument = args[:instrument]
      @birthdate = args[:birthdate]
      @experience = args[:experience]
      @conflicts = args[:conflicts]
    end
    # rubocop:enable Metrics/AbcSize

    def to_row
      [
        @name,
        @email,
        @city,
        @state,
        @pronouns,
        @shoe_size,
        @shirt_size,
        @birthdate,
        @date.strftime('%-m/%-d %-l:%M %P'),
        @experience,
        @conflicts
      ]
    end
  end
end
