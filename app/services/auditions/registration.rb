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
    rescue StandardError => e
      Rails.logger.warn("[AUDITIONS] Failed to load registration product names from config, using fallback: #{e.message}")
      PRODUCT_NAMES
    end

    def self.type_mapping
      Configuration.registration_type_mapping
    rescue StandardError => e
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

      # Validate that we have the required fields
      required_fields = [
        field_mappings['first_name_field'], field_mappings['last_name_field'],
        field_mappings['city_field'], field_mappings['state_field'],
        field_mappings['instrument_field']
      ]

      validation_result = DataValidator.validate_custom_fields(
        custom_fields, required_fields, 'Registration custom fields'
      )

      unless validation_result.success?
        Logger.warn('Registration validation failed, attempting fallback', {
                      errors: validation_result.errors,
                      email: @email
                    })
        parse_custom_fields_fallback(custom_fields)
        return
      end

      # Parse required fields
      @first_name = find_field_value(custom_fields, field_mappings['first_name_field']).to_s.strip
      @last_name = find_field_value(custom_fields, field_mappings['last_name_field']).to_s.strip
      @city = find_field_value(custom_fields, field_mappings['city_field']).to_s.titleize

      state_value = find_field_value(custom_fields, field_mappings['state_field'])
      parse_state_field(state_value)

      @instrument = find_field_value(custom_fields, field_mappings['instrument_field']).to_s.strip

      # Parse optional fields (these may be missing without causing failure)
      @pronouns = find_field_value(custom_fields, field_mappings['pronouns_field']).to_s.strip
      @shoe_size = find_field_value(custom_fields, field_mappings['shoe_size_field']).to_s.strip
      @shirt_size = find_field_value(custom_fields, field_mappings['shirt_size_field']).to_s.strip
      @birthdate = find_field_value(custom_fields, field_mappings['birthdate_field']).to_s.strip
      @experience = find_field_value(custom_fields, field_mappings['experience_field']).to_s.strip
      @conflicts = find_field_value(custom_fields, field_mappings['conflicts_field']).to_s.strip
    rescue StandardError => e
      Logger.error('Failed to parse registration custom fields', e, {
                     product_name: @type,
                     email: @email
                   })
      # Fall back to hard-coded field names
      parse_custom_fields_fallback(custom_fields)
    end

    def find_field_value(custom_fields, field_name)
      field = custom_fields.find { |f| f['label'] == field_name }
      field&.dig('value') || ''
    end

    def parse_state_field(state_value)
      return @state = '' unless state_value.present?

      state_str = state_value.to_s.strip
      if state_str.length == 2
        @state = state_str.upcase
      else
        @state = StateConverterService.abbreviation(state_str)
      end
    rescue StandardError => e
      Logger.warn('Failed to parse state field', e, {
                    state_value: state_value,
                    email: @email
                  })
      @state = state_str
    end

    def parse_custom_fields_fallback(custom_fields)
      Logger.info('Using fallback parsing for registration custom fields', { email: @email })

      @first_name = find_field_value(custom_fields, 'First Name')
      @last_name = find_field_value(custom_fields, 'Last Name')
      @city = find_field_value(custom_fields, 'City').titleize

      state_value = find_field_value(custom_fields, 'State')
      parse_state_field(state_value)

      @pronouns = find_field_value(custom_fields, 'Preferred Pronouns')
      @shoe_size = find_field_value(custom_fields, 'Shoe Size')
      @shirt_size = find_field_value(custom_fields, 'Shirt Size')
      @instrument = find_field_value(custom_fields, 'Primary Instrument')
      @birthdate = find_field_value(custom_fields, 'Birthdate')
      @experience = find_field_value(custom_fields, 'Experience')
      @conflicts = find_field_value(custom_fields, 'Known Conflicts')
    end
    # rubocop:enable Metrics/AbcSize
  end
end
