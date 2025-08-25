# frozen_string_literal: true

module Auditions
  class Configuration
    class << self
      def current_year
        @current_year ||= ENV.fetch('AUDITIONS_YEAR', Date.current.year.to_s)
      end

      def config_data
        @config_data ||= YAML.load_file(config_file_path)
      rescue Errno::ENOENT
        Rails.logger.error("[AUDITIONS] Configuration file not found: #{config_file_path}")
        raise "Auditions configuration file not found for year #{current_year}"
      rescue Psych::SyntaxError => e
        Rails.logger.error("[AUDITIONS] Invalid YAML in configuration file: #{e.message}")
        raise "Invalid auditions configuration file for year #{current_year}: #{e.message}"
      end

      def date_range
        @date_range ||= {
          start_date: config_data['date_range']['start'],
          end_date: config_data['date_range']['end']
        }
      end

      def packet_product_names
        @packet_product_names ||= config_data['products']['packets'].keys
      end

      def registration_product_names
        @registration_product_names ||= config_data['products']['registrations'].keys
      end

      def packet_type_mapping
        @packet_type_mapping ||= config_data['products']['packets']
      end

      def registration_type_mapping
        @registration_type_mapping ||= config_data['products']['registrations']
      end

      def field_mappings
        @field_mappings ||= config_data['field_mappings']
      end

      def packet_field_mappings
        field_mappings['packet']
      end

      def registration_field_mappings
        field_mappings['registration']
      end

      def spreadsheet_id
        @spreadsheet_id ||= ENV.fetch('AUDITIONS_SPREADSHEET_ID', nil)
      end

      def packets_sheet_name
        'Packets'
      end

      def registrations_sheet_name
        'Registrations'
      end

      def recruitment_spreadsheet_id
        @recruitment_spreadsheet_id ||= ENV.fetch('RECRUITMENT_SPREADSHEET_ID', nil)
      end

      # Reset cached data (useful for tests)
      def reset!
        @current_year = nil
        @config_data = nil
        @date_range = nil
        @packet_product_names = nil
        @registration_product_names = nil
        @packet_type_mapping = nil
        @registration_type_mapping = nil
        @field_mappings = nil
        @spreadsheet_id = nil
        @recruitment_spreadsheet_id = nil
      end

      private

      def config_file_path
        Rails.root.join('config', 'auditions', "#{current_year}.yml")
      end
    end
  end
end
