# frozen_string_literal: true

module Auditions
  class Registration
    attr_reader :type, :name, :email, :city, :state, :instrument, :date, :experience, :age_in_april

    PRODUCT_NAMES = [
      'CC22 Music Audition Registration',
      'CC22 Visual Audition Registration',
      'CC22 Music Ensemble Audition Registration',
      'CC22 Visual Ensemble Audition Registration'
    ].freeze

    # Because I messed up naming the product on Squarespace originally
    TYPE_MAP = {
      'CC22 Music Audition Registration' => 'Music Registration',
      'CC22 Music Ensemble Audition Registration' => 'Music Registration',
      'CC22 Visual Audition Registration' => 'Visual Registration',
      'CC22 Visual Ensemble Audition Registration' => 'Visual Registration',
    }.freeze

    FIELD_TO_SYMBOL = {
      'Name' => :name,
      'Email' => :email,
      'City' => :city,
      'State' => :state,
      'Primary Instrument/Section' => :instrument,
      'Age by 4/1/2022' => :age_in_april,
      'Experience' => :experience
    }.freeze

    class << self
      def header_row
        ['Name', 'Email', 'City', 'State', 'Age in April', 'Downloaded', 'Experience']
      end
    end

    def initialize(args)
      @type = TYPE_MAP[args[:type]]
      @name = args[:name]
      @email = args[:email]
      @city = args[:city]
      @state = args[:state]
      @instrument = args[:instrument]
      @date = args[:date] - 4.hours
      @experience = args[:experience]
      @age_in_april = args[:age_in_april]
    end

    def to_row
      [@name, @email, @city, @state, @age_in_april, @date.strftime('%-m/%-d %-l:%M %P'), @experience]
    end
  end
end