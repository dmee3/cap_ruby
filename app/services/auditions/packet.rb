# frozen_string_literal: true
module Auditions
  class Packet
    attr_reader :type, :name, :email, :city, :state, :instrument, :date

    PRODUCT_NAMES = [
      'CC22 Battery Audition Packet',
      'CC22 Cymbal Audition Packet',
      'CC22 Front Ensemble Audition Packet',
      'CC22 Visual Ensemble Audition Packet'
    ].freeze

    FIELD_TO_SYMBOL = {
      'Name' => :name,
      'Email' => :email,
      'City' => :city,
      'State' => :state,
      'Primary Instrument/Section' => :instrument,
      'Primary Instrument' => :instrument
    }.freeze

    class << self
      def header_row
        %w[Name Email City State Downloaded].freeze
      end
    end

    def initialize(args)
      @type = args[:type].gsub(/CC22 /, '')
      @name = args[:name].titleize
      @email = args[:email]
      @city = args[:city]
      @state = args[:state]
      @instrument = args[:instrument]
      @date = args[:date] - 4.hours
    end

    def to_row
      [@name, @email, @city, @state, @date.strftime('%-m/%-d %-l:%M %P')]
    end
  end
end