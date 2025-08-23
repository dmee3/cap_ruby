# frozen_string_literal: true

module Auditions
  class Packet
    attr_reader :type, :first_name, :last_name, :email, :city, :state, :instrument, :date

    # Note for next year - make sure to share the spreadsheets with the service account!
    PRODUCT_NAMES = [
      'Cap City 2026 Battery Audition Packet',
      'Cap City 2026 Cymbal Audition Packet',
      'Cap City 2026 Front Ensemble Audition Packet',
      'Cap City 2026 Visual Ensemble Audition Packet'
    ].freeze

    FIELD_TO_SYMBOL = {
      'First Name' => :first_name,
      'Last Name' => :last_name,
      'City' => :city,
      'State' => :state,
      'Primary Instrument' => :instrument
    }.freeze

    class << self
      def header_row
        ['First Name', 'Last Name', 'Email', 'City', 'State', 'Downloaded'].freeze
      end
    end

    def initialize(args)
      @type = args[:type]
      @first_name = args[:first_name]
      @last_name = args[:last_name]
      @email = args[:email]
      @city = args[:city].titleize
      @state = StateConverterService.abbreviation(args[:state])
      @instrument = args[:instrument]
      @date = args[:date] - 4.hours
    end

    def to_row
      [@first_name, @last_name, @email, @city, @state, @date.strftime('%-m/%-d %-l:%M %P')]
    end
  end
end
