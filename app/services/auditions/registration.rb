# frozen_string_literal: true

module Auditions
  class Registration
    attr_reader :type, :first_name, :last_name, :email, :city, :state, :instrument, :date,
                :experience, :birthdate

    # Product names and mappings are now configured in config/auditions/{year}.yml
    # Keep these constants as fallbacks for backwards compatibility
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

    def self.product_names
      Configuration.registration_product_names
    rescue => e
      Rails.logger.warn("[AUDITIONS] Failed to load registration product names from config, using fallback: #{e.message}")
      PRODUCT_NAMES
    end

    def self.type_mapping
      Configuration.registration_type_mapping
    rescue => e
      Rails.logger.warn("[AUDITIONS] Failed to load registration type mapping from config, using fallback: #{e.message}")
      TYPE_MAP
    end

    class << self
      def header_row
        ['First Name', 'Last Name', 'Email', 'City', 'State', 'Pronouns', 'Shoe', 'Shirt',
         'Birthdate', 'Purchased', 'Experience', 'Conflicts']
      end
    end

    # rubocop:disable Metrics/AbcSize
    def initialize(date:, item:, email:)
      @type = self.class.type_mapping[item['productName']]
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
      field_mappings = Configuration.registration_field_mappings
      
      @first_name = custom_fields.find { |field| field['label'] == field_mappings['first_name_field'] }['value']
      @last_name = custom_fields.find { |field| field['label'] == field_mappings['last_name_field'] }['value']

      @city = custom_fields.find { |field| field['label'] == field_mappings['city_field'] }['value'].titleize
      state = custom_fields.find { |field| field['label'] == field_mappings['state_field'] }
      if state.length == 2
        @state = state['value']
      else
        @state = StateConverterService.abbreviation(state['value'])
      end

      @pronouns = custom_fields.find { |field| field['label'] == field_mappings['pronouns_field'] }['value']
      @shoe_size = custom_fields.find { |field| field['label'] == field_mappings['shoe_size_field'] }['value']
      @shirt_size = custom_fields.find { |field| field['label'] == field_mappings['shirt_size_field'] }['value']
      @instrument = custom_fields.find { |field| field['label'] == field_mappings['instrument_field'] }['value']
      @birthdate = custom_fields.find { |field| field['label'] == field_mappings['birthdate_field'] }['value']
      @experience = custom_fields.find { |field| field['label'] == field_mappings['experience_field'] }['value']
      @conflicts = custom_fields.find { |field| field['label'] == field_mappings['conflicts_field'] }['value']
    rescue => e
      Rails.logger.error("[AUDITIONS] Failed to parse registration custom fields: #{e.message}")
      # Fall back to hard-coded field names
      parse_custom_fields_fallback(custom_fields)
    end

    def parse_custom_fields_fallback(custom_fields)
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
