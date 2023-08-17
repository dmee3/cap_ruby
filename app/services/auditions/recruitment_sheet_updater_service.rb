# frozen_string_literal: true

module Auditions
  class RecruitmentSheetUpdaterService

    TAB_NAMES = ['FE', 'SD', 'TN', 'BD', 'CYM', 'VE'].freeze
    SPREADSHEET_ID = ENV['RECRUITMENT_SPREADSHEET_ID']


    def self.update(packets, registrations, profiles)
      new.update(packets, registrations, profiles)
    end

    def initialize
    end

    def update(packets, registrations, profiles)
      TAB_NAMES.each do |tab_name|
        rows = GoogleSheetsApi.read_sheet(SPREADSHEET_ID, tab_name)
        next if rows&.blank?

        rows.each do |row|
          next unless is_person?(row)

          profile = find_matching_profile(row, profiles)
          next unless profile

          add_packet(row, profile.packets) if profile.packets.present?
          add_registration(row) if profile.registrations.present?
        end

        GoogleSheetsApi.write_sheet(SPREADSHEET_ID, tab_name, rows)
      end
    end

    private

    def is_person?(row)
      row[0] == "VET" || (row[0] == "" && row[1].present?)
    end

    def find_matching_profile(row, profiles)
      profiles.find { |pro| pro.first_name == row[1] && pro.last_name == row[2] }
    end

    def add_packet(row, packets)
      row.tap do |r|
        r[7] = "Y"
        return if r[9] =~ /packet downloaded/

        packets.each do |p|
          name = p[:type].gsub('CC24 ', '').gsub('Audition ', '')
          r[9] = "#{name} downloaded. #{r[9]}"
        end
      end
    end

    def add_registration(row)
      row.tap do |r|
        r[8] = "Y"
      end
    end
  end
end
