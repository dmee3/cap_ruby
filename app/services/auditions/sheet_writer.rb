# frozen_string_literal: true

module Auditions
  class SheetWriter
    def initialize(sheets_api: External::GoogleSheetsApi)
      @sheets_api = sheets_api
    end

    def call(profiles)
      Logger.step('Write profiles to spreadsheets') do
        write_profiles_to_sheets(profiles)
      end
    end

    private

    attr_reader :sheets_api

    def write_profiles_to_sheets(profiles)
      packet_data = build_packet_data(profiles)
      registration_data = build_registration_data(profiles)

      packets_result = write_packets_sheet(packet_data)
      return packets_result if packets_result.is_a?(Result) && packets_result.failure?

      registrations_result = write_registrations_sheet(registration_data)
      if registrations_result.is_a?(Result) && registrations_result.failure?
        return registrations_result
      end

      Logger.info('Spreadsheet update completed successfully', {
                    packets_written: packet_data.size,
                    registrations_written: registration_data.size
                  })

      Result.success({
                       packets_count: packet_data.size,
                       registrations_count: registration_data.size
                     })
    end

    def build_packet_data(profiles)
      Logger.debug('Building packet data for spreadsheet')

      packets = profiles.filter_map(&:packet)
      [Packet.header_row] + packets.map(&:to_row)
    end

    def build_registration_data(profiles)
      Logger.debug('Building registration data for spreadsheet')

      registrations = profiles.filter_map(&:registration)
      [Registration.header_row] + registrations.map(&:to_row)
    end

    def write_packets_sheet(packet_data)
      Logger.debug('Writing packet data to spreadsheet', { rows: packet_data.size })

      clear_and_format_sheet(Configuration.packets_sheet_name)

      sheets_api.write_sheet(
        Configuration.spreadsheet_id,
        Configuration.packets_sheet_name,
        packet_data,
        formulae: false
      )

      Logger.info('Packets sheet updated successfully')
      nil # Success - no Result object needed
    rescue StandardError => e
      Logger.error('Failed to write packets sheet', e)
      Result.failure(["Failed to write packets sheet: #{e.message}"])
    end

    def write_registrations_sheet(registration_data)
      Logger.debug('Writing registration data to spreadsheet', { rows: registration_data.size })

      clear_and_format_sheet(Configuration.registrations_sheet_name)

      sheets_api.write_sheet(
        Configuration.spreadsheet_id,
        Configuration.registrations_sheet_name,
        registration_data,
        formulae: false
      )

      Logger.info('Registrations sheet updated successfully')
      nil # Success - no Result object needed
    rescue StandardError => e
      Logger.error('Failed to write registrations sheet', e)
      Result.failure(["Failed to write registrations sheet: #{e.message}"])
    end

    def clear_and_format_sheet(sheet_name)
      Logger.debug('Clearing and formatting sheet', { sheet_name: sheet_name })

      sheets_api.clear_sheet(Configuration.spreadsheet_id, sheet_name)
      # Skip complex formatting for now - the new architecture prioritizes simplicity
      # sheets_api.format_sheet(...) - would require complex formatting data
    rescue StandardError => e
      Logger.error('Failed to clear/format sheet', e, { sheet_name: sheet_name })
      raise
    end
  end
end
