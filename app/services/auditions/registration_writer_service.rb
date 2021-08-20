module Auditions
  class RegistrationWriterService
    def self.write_registrations(registrations)
      new.write_registrations(registrations)
    end

    def initialize
      @header_rows = []
      @subheader_rows = []
      @instrument_rows = []
      @sheet_name = 'Registrations'
      @range = "'#{@sheet_name}'!A1:Z1000"
      @values = []
    end

    def write_registrations(registrations)
      data_hash = registration_hash(registrations)
      prepare_data(data_hash)
      GoogleSheetsApi.clear_sheet(@sheet_name)
      GoogleSheetsApi.format_sheet(@sheet_name, @header_rows, @subheader_rows, @instrument_rows)
      GoogleSheetsApi.write_sheet(@sheet_name, [{ range: @range, values: @values }])
    end

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

    # Takes the output of registration_hash() and turns it into a giant array to
    # write to Google Sheets, along with figuring out the header, subheader,
    # and instrument rows for formatting
    def prepare_data(registration_hash)
      registration_hash.each do |registration_name, registrations_by_instrument|
        @values << [registration_name]
        @header_rows << @values.length - 1
        @values << Registration.header_row
        @subheader_rows << @values.length - 1
        registrations_by_instrument.each do |instrument, registrations|
          @values << [instrument]
          @instrument_rows << @values.length - 1
          @values += registrations.map(&:to_row)
          @values << []
        end
      end
    end
  end
end
