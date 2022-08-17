# frozen_string_literal: true

module Auditions
  class PacketWriterService
    def self.write_packets(packets, registered_emails)
      new.write_packets(packets, registered_emails)
    end

    def initialize
      @header_rows = []
      @subheader_rows = []
      @instrument_rows = []
      @registered_rows = []
      @sheet_name = 'Packets'
      @values = []
    end

    def write_packets(packets, registered_emails)
      data_hash = packet_hash(packets)
      prepare_data(data_hash, registered_emails)
      GoogleSheetsApi.clear_sheet(@sheet_name)
      GoogleSheetsApi.format_sheet(
        @sheet_name,
        @header_rows,
        @subheader_rows,
        @instrument_rows,
        @registered_rows
      )
      GoogleSheetsApi.write_sheet(@sheet_name, @values)
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

    # Takes the output of packet_hash() and turns it into a giant array to
    # write to Google Sheets, along with figuring out the header, subheader,
    # instrument, and registered rows for formatting
    # rubocop:disable Metrics/AbcSize, Metrics/MethodLength
    def prepare_data(packet_hash, registered_emails)
      packet_hash.each do |packet_name, packets_by_instrument|
        count = packets_by_instrument.values.reduce(0) { |sum, i| sum + i.count }

        @values << ["#{packet_name} (#{count} Total)"]
        @header_rows << @values.length - 1

        @values << Packet.header_row
        @subheader_rows << @values.length - 1

        packets_by_instrument.each do |instrument, packets|
          @values << [instrument]
          @instrument_rows << @values.length - 1

          packets.each do |p|
            @values << p.to_row
            @registered_rows << @values.length - 1 if registered_emails.include?(p.email)
          end

          @values << []
        end
      end
    end
    # rubocop:enable Metrics/AbcSize, Metrics/MethodLength
  end
end
