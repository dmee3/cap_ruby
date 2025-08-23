# frozen_string_literal: true

module Auditions
  class Registration
    attr_reader :type, :first_name, :last_name, :email, :city, :state, :instrument, :date,
                :experience, :birthdate

    PRODUCT_NAMES = [
      'CC26 Music Ensemble Audition Registration',
      'CC26 Visual Ensemble Audition Registration'
    ].freeze

    TYPE_MAP = {
      'CC26 Music Ensemble Audition Registration' => 'Music Registration',
      'CC26 Visual Ensemble Audition Registration' => 'Visual Registration'
    }.freeze

    FIELD_TO_SYMBOL = {
      'First Name' => :first_name,
      'Last Name' => :last_name,
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
        ['First Name', 'Last Name', 'Email', 'City', 'State', 'Pronouns', 'Shoe', 'Shirt',
         'Birthdate', 'Purchased', 'Experience', 'Conflicts']
      end
    end

    # rubocop:disable Metrics/AbcSize
    def initialize(date:, item:, email:)
      @type = TYPE_MAP[item['productName']]
      @date = date - 4.hours
      @email = email

      parse_custom_fields(item['customizations'])
    end

    def to_row
      [
        @first_name,
        @last_name,
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

    private

    def parse_custom_fields(custom_fields)
      @first_name = custom_fields.find { |field| field['label'] == 'First Name' }['value']
      @last_name = custom_fields.find { |field| field['label'] == 'Last Name' }['value']

      @city = custom_fields.find { |field| field['label'] == 'City' }['value'].titleize
      state = custom_fields.find { |field| field['label'] == 'State' }
      if state.length == 2
        @state = state['value']
      else
        @state = StateConverterService.abbreviation(state['value'])
      end

      @pronouns = custom_fields.find { |field| field['label'] == 'Preferred Pronouns' }['value']
      @shoe_size = custom_fields.find { |field| field['label'] == 'Shoe Size' }['value']
      @shirt_size = custom_fields.find { |field| field['label'] == 'Shirt Size' }['value']
      @instrument = custom_fields.find { |field| field['label'] == 'Primary Instrument' }['value']
      @birthdate = custom_fields.find { |field| field['label'] == 'Birthdate' }['value']
      @experience = custom_fields.find { |field| field['label'] == 'Experience' }['value']
      @conflicts = custom_fields.find { |field| field['label'] == 'Known Conflicts' }['value']
    end
    # rubocop:enable Metrics/AbcSize
  end
end
