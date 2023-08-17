# frozen_string_literal: true

module Auditions
  class PacketAndRegistrationWriterService
    SPREADSHEET_ID = ENV['AUDITIONS_SPREADSHEET_ID']

    def self.write_data(packets, registrations)
      new.write_data(packets, registrations)
    end

    def initialize
      @packet_sheet_data = {
        header_rows: [],
        subheader_rows: [],
        instrument_rows: [],
        registered_rows: [],
        sheet_name: 'Packets',
        values: []
      }
      @registration_sheet_data = {
        header_rows: [],
        subheader_rows: [],
        instrument_rows: [],
        sheet_name: 'Registrations',
        values: []
      }
    end

    def write_data(packets, registrations)
      write_packets(packets, registrations)
      write_registrations(registrations)
    end

    def write_packets(packets, registrations)
      data_hash = packet_hash(packets)
      prepare_packet_data(data_hash, registrations)
      GoogleSheetsApi.clear_sheet(SPREADSHEET_ID, @packet_sheet_data[:sheet_name])
      GoogleSheetsApi.format_sheet(
        SPREADSHEET_ID,
        @packet_sheet_data[:sheet_name],
        @packet_sheet_data[:header_rows],
        @packet_sheet_data[:subheader_rows],
        @packet_sheet_data[:instrument_rows],
        @packet_sheet_data[:registered_rows]
      )
      GoogleSheetsApi.write_sheet(
        SPREADSHEET_ID, @packet_sheet_data[:sheet_name], @packet_sheet_data[:values], formulae: false
      )
    end

    def write_registrations(registrations)
      data_hash = registration_hash(registrations)
      prepare_registration_data(data_hash)
      GoogleSheetsApi.clear_sheet(SPREADSHEET_ID, @registration_sheet_data[:sheet_name])
      GoogleSheetsApi.format_sheet(
        SPREADSHEET_ID,
        @registration_sheet_data[:sheet_name],
        @registration_sheet_data[:header_rows],
        @registration_sheet_data[:subheader_rows],
        @registration_sheet_data[:instrument_rows]
      )
      GoogleSheetsApi.write_sheet(
        SPREADSHEET_ID, @registration_sheet_data[:sheet_name], @registration_sheet_data[:values], formulae: false
      )
    end

    # {
    #   'Battery Audition Packet' => {
    #     'Snare' => [
    #       <Packet>,
    #       <Packet>
    #     ],
    #     'Tenors' => [ ... ],
    #     ...
    #   },
    #   'Cymbal Audition Packet' => {
    #     'Snare' => [ ... ],
    #     ...
    #   },
    #   ...
    # }
    # rubocop:disable Metrics/AbcSize
    def packet_hash(all_packets)
      packet_names = all_packets.map(&:type).uniq.sort
      {}.tap do |hsh|
        packet_names.each do |name|
          hsh[name] = {}
          relevant_packets = all_packets.select { |p| p.type == name }
          instruments = relevant_packets.map(&:instrument).uniq.sort

          instruments.each do |instrument|
            hsh[name][instrument] = relevant_packets.select { |p| p.instrument == instrument }
          end
        end
      end
    end
    # rubocop:enable Metrics/AbcSize

    # {
    #   'Music Registration' => {
    #     'Snare' => [
    #       <Registration>,
    #       <Registration>
    #     ],
    #     'Tenors' => [ ... ],
    #     ...
    #   },
    #   'Visual Registration' => {
    #     'Snare' => [ ... ],
    #     ...
    #   },
    #   ...
    # }
    # rubocop:disable Metrics/AbcSize
    def registration_hash(all_registrations)
      registration_names = all_registrations.map(&:type).uniq.sort
      {}.tap do |hsh|
        registration_names.each do |name|
          hsh[name] = {}
          relevant_registrations = all_registrations.select { |p| p.type == name }
          instruments = relevant_registrations.map(&:instrument).uniq.sort

          instruments.each do |instrument|
            hsh[name][instrument] = relevant_registrations.select { |p| p.instrument == instrument }
          end
        end
      end
    end
    # rubocop:enable Metrics/AbcSize

    # Takes the output of packet_hash() and turns it into a giant array to
    # write to Google Sheets, along with figuring out the header, subheader,
    # instrument, and registered rows for formatting
    # rubocop:disable Metrics/AbcSize, Metrics/MethodLength
    def prepare_packet_data(packet_hash, registrations)
      registered_emails = registrations.map(&:email)
      packet_hash.each do |packet_name, packets_by_instrument|
        count = packets_by_instrument.values.reduce(0) { |sum, i| sum + i.count }

        @packet_sheet_data[:values] << ["#{packet_name} (#{count} Total)"]
        @packet_sheet_data[:header_rows] << @packet_sheet_data[:values].length - 1

        @packet_sheet_data[:values] << Packet.header_row
        @packet_sheet_data[:subheader_rows] << @packet_sheet_data[:values].length - 1

        packets_by_instrument.each do |instrument, packets|
          @packet_sheet_data[:values] << [instrument]
          @packet_sheet_data[:instrument_rows] << @packet_sheet_data[:values].length - 1

          packets.each do |p|
            @packet_sheet_data[:values] << p.to_row
            if registered_emails.include?(p.email)
              @packet_sheet_data[:registered_rows] << @packet_sheet_data[:values].length - 1
            end
          end

          @packet_sheet_data[:values] << []
        end
      end
    end
    # rubocop:enable Metrics/AbcSize, Metrics/MethodLength

    # Takes the output of registration_hash() and turns it into a giant array to
    # write to Google Sheets, along with figuring out the header, subheader,
    # and instrument rows for formatting
    # rubocop:disable Metrics/AbcSize
    def prepare_registration_data(registration_hash)
      registration_hash.each do |registration_name, registrations_by_instrument|
        count = registrations_by_instrument.values.reduce(0) { |sum, i| sum + i.count }
        @registration_sheet_data[:values] << ["#{registration_name} (#{count} Total)"]
        @registration_sheet_data[:header_rows] << @registration_sheet_data[:values].length - 1
        @registration_sheet_data[:values] << Registration.header_row
        @registration_sheet_data[:subheader_rows] << @registration_sheet_data[:values].length - 1
        registrations_by_instrument.each do |instrument, registrations|
          @registration_sheet_data[:values] << [instrument]
          @registration_sheet_data[:instrument_rows] << @registration_sheet_data[:values].length - 1
          @registration_sheet_data[:values] += registrations.map(&:to_row)
          @registration_sheet_data[:values] << []
        end
      end
    end
    # rubocop:enable Metrics/AbcSize
  end
end
