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

    class << self
      def header_row
        ['First Name', 'Last Name', 'Email', 'City', 'State', 'Downloaded'].freeze
      end
    end

    def initialize(date:, item:, email:)
      @type = item['productName']
      @date = date - 4.hours
      @email = email

      parse_custom_fields(item['customizations'])
    end

    def to_row
      [@first_name, @last_name, @email, @city, @state, @date.strftime('%-m/%-d %-l:%M %P')]
    end

    private

    def parse_custom_fields(custom_fields)
      name = custom_fields.find { |field| field['label'] == 'Name' }
      @first_name = name['value'].split[0]
      @last_name = name['value'].split[1..].join(' ')
      @city = custom_fields.find { |field| field['label'] == 'City' }['value'].titleize
      state = custom_fields.find { |field| field['label'] == 'State' }
      if state.length == 2
        @state = state['value']
      else
        @state = StateConverterService.abbreviation(state['value'])
      end
      @instrument = custom_fields.find { |field| field['label'] == 'Instrument' }['value']
    end
  end
end
