# frozen_string_literal: true

module Auditions
  class RecruitmentSheetUpdaterService

    TAB_NAMES = ['FE', 'SD', 'TN', 'BD', 'CYM', 'VE'].freeze
    SPREADSHEET_ID = ENV['RECRUITMENT_SPREADSHEET_ID']
    FRONT_ENSEMBLE_INSTRUMENTS_ON_FORM = [
      'Marimba',
      'Vibraphone',
      'Xylophone',
      'Glockenspiel',
      'Auxiliary Percussion',
      'Drum Kit',
      'Synthesizer',
      'Bass Guitar'
    ].freeze
    AUTOMATED_PROFILE_STRING = 'THE FOLLOWING PEOPLE HAVE DOWNLOADED PACKETS OR REGISTERED, BUT WERE NOT ON THE RECRUITMENT DOC. PLEASE SORT THEM INTO THE ROWS ABOVE AS NECESSARY.'.freeze


    def self.update(profiles)
      new.update(profiles)
    end

    def initialize
    end

    def update(profiles)
      TAB_NAMES.each do |tab_name|
        rows = GoogleSheetsApi.read_sheet(SPREADSHEET_ID, tab_name)
        next if rows&.blank?

        update_existing_rows(rows, profiles)


        add_new_rows(tab_name, profiles, rows)

        GoogleSheetsApi.write_sheet(SPREADSHEET_ID, tab_name, rows, formulae: true)
      end
    end

    private

    def update_existing_rows(rows, profiles)
      rows.each do |row|
        next unless is_person?(row)

        profile = find_matching_profile(row, profiles)
        next unless profile

        mark_packet(row, profile.packets) if profile.packets.present?
        mark_registration(row) if profile.registrations.present?
      end
    end

    def add_new_rows(tab_name, profiles, rows)
      if !rows.any? { |row| row[0] == AUTOMATED_PROFILE_STRING }
        rows << []
        rows << [AUTOMATED_PROFILE_STRING]
      end

      # Special handling for front ensemble
      if tab_name == 'FE'
        FRONT_ENSEMBLE_INSTRUMENTS_ON_FORM.each do |instrument|
          new_profiles = profiles.select do |pro|
            pro.instrument == instrument
          end.reject { |pro| rows.any? { |row| profile_matches_row(row, pro) } }

          new_rows = new_profiles.map do |pro|
            profile_to_row(pro).tap { |row| row[9] = "#{row[9]}Marked instrument as #{instrument}." }
          end
          rows.concat(new_rows)
        end
      else
        instrument = tab_name_to_instrument(tab_name)
        new_profiles = profiles.select do |pro|
          pro.instrument == instrument
        end.reject { |pro| rows.any? { |row| profile_matches_row(row, pro) } }

        rows.concat(new_profiles.map { |pro| profile_to_row(pro) })
      end
    end

    def tab_name_to_instrument(tab_name)
      map = {
        'FE' => 'Marimba',
        'SD' => 'Snare',
        'TN' => 'Tenors',
        'BD' => 'Bass',
        'CYM' => 'Cymbals',
        'VE' => 'Visual Ensemble',
      }
      map[tab_name] || ''
    end

    def is_person?(row)
      row[0] == "VET" || (row[0] == "" && row[1].present?)
    end

    def find_matching_profile(row, profiles)
      profiles.find { |pro| profile_matches_row(row, pro) }
    end

    def profile_matches_row(row, profile)
      profile.first_name.strip == row[1].to_s.strip && profile.last_name.strip == row[2].to_s.strip
    end

    def mark_packet(row, packets)
      row[7] = "Y"
      return if row[9]&.downcase =~ /packet downloaded/

      packets.each do |p|
        name = p[:type].gsub('CC24 ', '').gsub('Audition ', '')
        row[9] = "#{name} downloaded. #{row[9]}"
      end
    end

    def mark_registration(row)
      row[6] = "REGISTERED"
      row[8] = "Y"
    end

    def profile_to_row(profile)
      row = [
        "",
        profile.first_name,
        profile.last_name,
        "",
        "#{profile.city}, #{profile.state}",
        profile.email,
        "",
        "",
        "",
        ""
      ]

      mark_packet(row, profile.packets) if profile.packets.present?
      mark_registration(row) if profile.registrations.present?

      row
    end
  end
end
