# frozen_string_literal: true

module Auditions
  class RecruitmentRowBuilder
    # Tab-to-instruments mapping (shared with RecruitmentUpdater)
    TAB_INSTRUMENT_MAPPING = {
      'MALLETS' => %w[Marimba Vibraphone Xylophone Glockenspiel],
      'AUX' => ['Drum Kit', 'Auxiliary Percussion'],
      'ELECTRO' => ['Synthesizer', 'Bass Guitar'],
      'SD' => ['Snare'],
      'TN' => ['Tenors'],
      'BD' => ['Bass'],
      'CYM' => ['Cymbals'],
      'VE' => ['Visual Ensemble']
    }.freeze

    class << self
      def build_row_for_unsorted(profile, tab_name)
        row = [
          '',
          profile.first_name,
          profile.last_name,
          '',
          build_location_string(profile),
          profile.email,
          '',
          '',
          '',
          ''
        ]

        # For UNSORTED tab, always include instrument information for multi-instrument tabs
        mark_packet_downloaded(row, profile, tab_name) if profile.packet
        mark_registered(row) if profile.registration

        row
      end

      def update_existing_rows_for_tab(tab_name, rows, profiles)
        rows.each do |row|
          next unless person_row?(row)

          profile = find_matching_profile(row, profiles)
          next unless profile

          mark_packet_downloaded(row, profile, tab_name) if profile.packet
          mark_registered(row) if profile.registration
        end
      end

      def mark_packet_downloaded(row, profile, tab_name = nil)
        row[7] = 'Y'

        notes = row[9] || ''

        # Add instrument info if not already present (only for multi-instrument tabs)
        unless notes.downcase =~ /marked instrument as/
          instrument_note = build_instrument_note(profile, tab_name)
          notes = "#{instrument_note} #{notes}".strip if instrument_note.present?
        end

        # Add packet info if not already present
        unless notes.downcase =~ /packet/
          packet_name = extract_packet_name(profile.packet)
          notes = "#{packet_name} downloaded. #{notes}".strip
        end

        row[9] = notes
      end

      def mark_registered(row)
        row[6] = 'REGISTERED'
        row[8] = 'Y'
      end

      def person_row?(row)
        row[0] == 'VET' || (row[0].to_s.strip.empty? && row[1].present?)
      end

      def find_matching_profile(row, profiles)
        profiles.find { |profile| profile_matches_row?(profile, row) }
      end

      def profile_matches_row?(profile, row)
        return false unless row[1] && row[2]

        profile.first_name.to_s.strip.downcase == row[1].to_s.strip.downcase &&
          profile.last_name.to_s.strip.downcase == row[2].to_s.strip.downcase
      end

      private

      def extract_packet_name(packet)
        return 'Packet' unless packet&.type

        packet.type
              .gsub(/#{Configuration.current_year}\s*/, '')
              .gsub(/Cap City\s*/i, '')
              .gsub(/audition\s*/i, '')
              .strip
      end

      def build_instrument_note(profile, tab_name)
        return '' unless tab_name

        # Only add instrument note for multi-instrument tabs
        instruments = TAB_INSTRUMENT_MAPPING[tab_name] || []
        return '' unless instruments.size > 1

        # Determine the instrument to use:
        # 1. If there's a registration, use the instrument from the registration
        # 2. Otherwise, use the instrument from the packet (if available)
        instrument = nil

        if profile.registration&.instrument.present?
          instrument = profile.registration.instrument
        elsif profile.packet&.instrument.present?
          instrument = profile.packet.instrument
        end

        return '' unless instrument.present?

        " Marked instrument as #{instrument}."
      end

      def build_location_string(profile)
        return '' unless profile.packet

        city = profile.packet.city || ''
        state = profile.packet.state || ''

        return city if state.blank?
        return state if city.blank?

        "#{city}, #{state}"
      end
    end
  end
end
