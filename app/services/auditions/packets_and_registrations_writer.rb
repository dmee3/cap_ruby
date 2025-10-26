# frozen_string_literal: true

module Auditions
  class PacketsAndRegistrationsWriter
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
      packet_result = build_packet_data(profiles)
      registration_result = build_registration_data(profiles)

      packets_result = write_packets_sheet(packet_result[:data], packet_result[:formatting])
      return packets_result if packets_result.is_a?(Result) && packets_result.failure?

      registrations_result = write_registrations_sheet(registration_result[:data],
                                                       registration_result[:formatting])
      return registrations_result if registrations_result.is_a?(Result) && registrations_result.failure?

      Logger.info('Spreadsheet update completed successfully', {
                    packets_written: packet_result[:data].size,
                    registrations_written: registration_result[:data].size
                  })

      Result.success({
                       packets_count: packet_result[:data].size,
                       registrations_count: registration_result[:data].size
                     })
    end

    def build_packet_data(profiles)
      Logger.debug('Building packet data for spreadsheet')

      packets = profiles.filter_map(&:packet)
      build_organized_packet_data(packets)
    end

    def build_registration_data(profiles)
      Logger.debug('Building registration data for spreadsheet')

      registrations = profiles.filter_map(&:registration)
      build_organized_registration_data(registrations)
    end

    def write_packets_sheet(packet_data, formatting)
      Logger.debug('Writing packet data to spreadsheet', { rows: packet_data.size })

      clear_and_format_sheet(Configuration.packets_sheet_name)

      sheets_api.write_sheet(
        Configuration.spreadsheet_id,
        Configuration.packets_sheet_name,
        packet_data,
        formulae: false
      )

      # Apply formatting
      sheets_api.format_sheet(
        Configuration.spreadsheet_id,
        Configuration.packets_sheet_name,
        formatting[:header_rows],
        formatting[:subheader_rows],
        formatting[:instrument_rows]
      )

      Logger.info('Packets sheet updated successfully')
      nil # Success - no Result object needed
    rescue StandardError => e
      Logger.error('Failed to write packets sheet', e)
      Result.failure(["Failed to write packets sheet: #{e.message}"])
    end

    def write_registrations_sheet(registration_data, formatting)
      Logger.debug('Writing registration data to spreadsheet', { rows: registration_data.size })

      clear_and_format_sheet(Configuration.registrations_sheet_name)

      sheets_api.write_sheet(
        Configuration.spreadsheet_id,
        Configuration.registrations_sheet_name,
        registration_data,
        formulae: false
      )

      # Apply formatting
      sheets_api.format_sheet(
        Configuration.spreadsheet_id,
        Configuration.registrations_sheet_name,
        formatting[:header_rows],
        formatting[:subheader_rows],
        formatting[:instrument_rows]
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
    rescue StandardError => e
      Logger.error('Failed to clear/format sheet', e, { sheet_name: sheet_name })
      raise
    end

    def build_organized_packet_data(packets)
      # Group packets by type
      packets_by_type = packets.group_by(&:type)

      data_rows = []
      header_rows = []
      subheader_rows = []
      instrument_rows = []
      current_row = 0

      packets_by_type.each do |packet_type, packets_for_type|
        # Add packet type header (merged cell with red background, white text, 12pt, bold, centered)
        packet_name = Configuration.packet_type_display_names[packet_type] || packet_type
        header_text = "#{packet_name} (#{packets_for_type.size} downloads)"
        data_rows << [header_text]
        header_rows << current_row
        current_row += 1

        # Add column headers (black background, white text, 10pt, bold, left-aligned)
        data_rows << Packet.header_row
        subheader_rows << current_row
        current_row += 1

        # Group by instrument within this packet type
        packets_by_instrument = packets_for_type.group_by(&:instrument)

        packets_by_instrument.each do |instrument, packets_for_instrument|
          # Add instrument header
          instrument_name = instrument.present? ? instrument : 'No Instrument Listed'
          data_rows << [instrument_name]
          instrument_rows << current_row
          current_row += 1

          # Add packet data rows (sorted by date)
          packets_for_instrument.sort_by(&:date).each do |packet|
            data_rows << packet.to_row
            current_row += 1
          end
        end

        # Add spacing between packet types (except after the last one)
        unless packet_type == packets_by_type.keys.last
          data_rows << [''] # Empty row for spacing
          current_row += 1
        end
      end

      {
        data: data_rows,
        formatting: {
          header_rows: header_rows,
          subheader_rows: subheader_rows,
          instrument_rows: instrument_rows
        }
      }
    end

    def build_organized_registration_data(registrations)
      # Group registrations by type
      registrations_by_type = registrations.group_by(&:type)

      data_rows = []
      header_rows = []
      subheader_rows = []
      instrument_rows = []
      current_row = 0

      registrations_by_type.each do |registration_type, registrations_for_type|
        # Add registration type header (merged cell with red background, white text, 12pt, bold, centered)
        registration_name = registration_type
        header_text = "#{registration_name} (#{registrations_for_type.size} registrations)"
        data_rows << [header_text]
        header_rows << current_row
        current_row += 1

        # Add column headers (black background, white text, 10pt, bold, left-aligned)
        data_rows << Registration.header_row
        subheader_rows << current_row
        current_row += 1

        # Group by instrument within this registration type
        registrations_by_instrument = registrations_for_type.group_by(&:instrument)

        registrations_by_instrument.each do |instrument, registrations_for_instrument|
          # Add instrument header
          instrument_name = instrument.present? ? instrument : 'No Instrument Listed'
          data_rows << [instrument_name]
          instrument_rows << current_row
          current_row += 1

          # Add registration data rows (sorted by date)
          registrations_for_instrument.sort_by(&:date).each do |registration|
            data_rows << registration.to_row
            current_row += 1
          end
        end

        # Add spacing between registration types (except after the last one)
        unless registration_type == registrations_by_type.keys.last
          data_rows << [''] # Empty row for spacing
          current_row += 1
        end
      end

      {
        data: data_rows,
        formatting: {
          header_rows: header_rows,
          subheader_rows: subheader_rows,
          instrument_rows: instrument_rows
        }
      }
    end
  end
end
