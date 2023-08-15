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
      'Primary Instrument' => :instrument,
      'Birthdate' => :birthdate,
      'Experience' => :experience
    }.freeze

    class << self
      def header_row
        ['Name', 'Email', 'City', 'State', 'Birthdate', 'Downloaded', 'Experience']
      end
    end

    # rubocop:disable Metrics/AbcSize
    def initialize(args)
      @type = TYPE_MAP[args[:type]]
      @name = args[:name]
      @email = args[:email]

      @city = args[:city]&.titleize
      @state = args[:state] ? StateConverterService.abbreviation(args[:state]) : ''
      @instrument = args[:instrument]
      @date = args[:date] - 4.hours
      @experience = args[:experience]
      @birthdate = args[:birthdate]
    end
    # rubocop:enable Metrics/AbcSize

    def to_row
      [@name, @email, @city, @state, @birthdate, @date.strftime('%-m/%-d %-l:%M %P'),
       @experience]
    end
  end
end
