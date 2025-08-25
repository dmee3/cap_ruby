# frozen_string_literal: true

module Auditions
  class Packet
    attr_reader :type, :first_name, :last_name, :email, :city, :state, :instrument, :date

    # Note for next year - make sure to share the spreadsheets with the service account!
    # Product names are now configured in config/auditions/{year}.yml
    # Keep this constant as a fallback for backwards compatibility
    PRODUCT_NAMES = [
      'Cap City 2026 Battery Audition Packet',
      'Cap City 2026 Cymbal Audition Packet',
      'Cap City 2026 Front Ensemble Audition Packet',
      'Cap City 2026 Visual Ensemble Audition Packet'
    ].freeze

    def self.product_names
      Configuration.packet_product_names
    rescue StandardError => e
      Rails.logger.warn("[AUDITIONS] Failed to load packet product names from config, using fallback: #{e.message}")
      PRODUCT_NAMES
    end

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
      field_mappings = Configuration.packet_field_mappings

      # Validate that we have the required fields
      validation_result = DataValidator.validate_custom_fields(
        custom_fields,
        [field_mappings['name_field'], field_mappings['city_field'],
         field_mappings['state_field'], field_mappings['instrument_field']],
        'Packet custom fields'
      )

      unless validation_result.success?
        Logger.warn('Packet validation failed, attempting fallback',
                    { errors: validation_result.errors })
        parse_custom_fields_fallback(custom_fields)
        return
      end

      name_field = custom_fields.find { |field| field['label'] == field_mappings['name_field'] }
      parse_name_field(name_field['value'])

      city_field = custom_fields.find { |field| field['label'] == field_mappings['city_field'] }
      @city = city_field['value'].to_s.titleize

      state_field = custom_fields.find { |field| field['label'] == field_mappings['state_field'] }
      parse_state_field(state_field['value'])

      instrument_field = custom_fields.find do |field|
        field['label'] == field_mappings['instrument_field']
      end
      @instrument = instrument_field['value'].to_s.strip
    rescue StandardError => e
      Logger.error('Failed to parse packet custom fields', e, {
                     product_name: @type,
                     email: @email
                   })
      # Fall back to hard-coded field names
      parse_custom_fields_fallback(custom_fields)
    end

    def parse_name_field(name_value)
      return unless name_value.present?

      name_parts = name_value.to_s.strip.split
      @first_name = name_parts[0] || ''
      @last_name = name_parts[1..].join(' ')
    end

    def parse_state_field(state_value)
      return unless state_value.present?

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
      Logger.info('Using fallback parsing for packet custom fields', { email: @email })

      name = custom_fields.find { |field| field['label'] == 'Name' }
      if name&.dig('value').present?
        parse_name_field(name['value'])
      else
        Logger.warn('Missing name field in packet', { email: @email })
        @first_name = ''
        @last_name = ''
      end

      city = custom_fields.find { |field| field['label'] == 'City' }
      @city = city&.dig('value')&.to_s&.titleize || ''

      state = custom_fields.find { |field| field['label'] == 'State' }
      if state&.dig('value').present?
        parse_state_field(state['value'])
      else
        @state = ''
      end

      instrument = custom_fields.find { |field| field['label'] == 'Instrument' }
      @instrument = instrument&.dig('value')&.to_s&.strip || ''
    end
  end
end
