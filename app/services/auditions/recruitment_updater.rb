# frozen_string_literal: true

module Auditions
  class RecruitmentUpdater
    TAB_NAMES = %w[MALLETS SD TN BD CYM AUX ELECTRO VE UNSORTED].freeze
    ORIGINAL_TAB_NAMES = %w[MALLETS SD TN BD CYM AUX ELECTRO VE].freeze

    # New tab-to-instruments mapping for the updated structure
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
    UNSORTED_HEADERS = [
      'THESE PEOPLE HAVE DOWNLOADED A PACKET OR REGISTERED,',
      'BUT ARE NOT ON THE RECRUITMENT DOC.',
      'PLEASE MOVE THEM TO YOUR TAB (CUT/PASTE FROM THIS ONE) AND REACH OUT.',
      'IF THEY ARE NOT A REAL PERSON (OR AGED OUT, JUST LOOKING AT THE PACKET), LEAVE THEM HERE.'
    ].freeze

    def initialize(sheets_api: External::GoogleSheetsApi)
      @sheets_api = sheets_api
    end

    def call(profiles)
      Logger.step('Update recruitment spreadsheets') do
        update_recruitment_sheets(profiles)
      end
    end

    private

    attr_reader :sheets_api

    def update_recruitment_sheets(profiles)
      unless recruitment_spreadsheet_id
        return Result.failure(['Recruitment spreadsheet ID not configured'])
      end

      Logger.debug('Starting recruitment sheet updates',
                   { tabs: TAB_NAMES.size, profiles: profiles.size })

      # First, update existing rows in original tabs (no new additions)
      all_new_profiles = []
      ORIGINAL_TAB_NAMES.each do |tab_name|
        result = update_existing_rows_only(tab_name, profiles)
        return result if result.is_a?(Result) && result.failure?

        # Collect profiles that don't exist in this tab
        new_profiles_for_tab = collect_new_profiles_for_tab(tab_name, profiles)
        all_new_profiles.concat(new_profiles_for_tab.map { |p| { profile: p, tab: tab_name } })
      end

      # Then, update the UNSORTED tab with all new profiles organized by section
      result = update_unsorted_tab(all_new_profiles)
      return result if result.is_a?(Result) && result.failure?

      Logger.info('Recruitment sheets updated successfully', { tabs_updated: TAB_NAMES.size })
      Result.success({ tabs_updated: TAB_NAMES.size, profiles_processed: profiles.size })
    end

    def update_existing_rows_only(tab_name, profiles)
      Logger.debug('Processing recruitment tab existing rows only', { tab: tab_name })

      rows = read_sheet_rows(tab_name)
      return Result.failure(["Failed to read recruitment sheet tab: #{tab_name}"]) if rows.nil?

      return Result.success({}) if rows.empty?

      RecruitmentRowBuilder.update_existing_rows_for_tab(tab_name, rows, profiles)

      write_result = write_sheet_rows(tab_name, rows)
      return write_result if write_result.is_a?(Result) && write_result.failure?

      Logger.debug('Tab existing rows updated successfully',
                   { tab: tab_name, total_rows: rows.size })
      nil # Success - no Result object needed
    rescue StandardError => e
      Logger.error('Failed to update recruitment tab existing rows', e, { tab: tab_name })
      Result.failure(["Failed to update recruitment tab #{tab_name}: #{e.message}"])
    end

    def collect_new_profiles_for_tab(tab_name, profiles)
      rows = read_sheet_rows(tab_name)
      return [] if rows.nil?

      instruments = TAB_INSTRUMENT_MAPPING[tab_name] || []

      if instruments.size > 1
        # Multi-instrument tab - collect profiles for any of the instruments
        instruments.flat_map do |instrument|
          find_new_profiles_for_instrument(profiles, rows, instrument)
        end.uniq
      else
        # Single instrument tab
        instrument = instruments.first
        return [] unless instrument

        find_new_profiles_for_instrument(profiles, rows, instrument)
      end
    rescue StandardError => e
      Logger.error('Failed to collect new profiles for tab', e, { tab: tab_name })
      []
    end

    def update_unsorted_tab(new_profiles_by_tab)
      Logger.debug('Updating UNSORTED tab', { profiles_count: new_profiles_by_tab.size })

      # Step 1: Clear the sheet completely
      clear_result = clear_sheet('UNSORTED')
      return clear_result if clear_result.is_a?(Result) && clear_result.failure?

      # Step 2: Always add headers + any profile data
      populate_result = populate_unsorted_tab(new_profiles_by_tab)
      return populate_result if populate_result.is_a?(Result) && populate_result.failure?

      Logger.debug('UNSORTED tab updated successfully')
      nil # Success
    rescue StandardError => e
      Logger.error('Failed to update UNSORTED tab', e)
      Result.failure(["Failed to update UNSORTED tab: #{e.message}"])
    end

    def populate_unsorted_tab(new_profiles_by_tab)
      # Always build headers, then add profile sections if any exist
      unsorted_data = build_unsorted_tab_data(new_profiles_by_tab)
      write_result = write_sheet_rows('UNSORTED', unsorted_data[:rows])
      return write_result if write_result.is_a?(Result) && write_result.failure?

      # Apply formatting to the UNSORTED tab
      format_result = format_unsorted_tab(unsorted_data[:formatting])
      return format_result if format_result.is_a?(Result) && format_result.failure?

      Logger.debug('UNSORTED tab populated successfully', { total_rows: unsorted_data[:rows].size })
      nil # Success
    rescue StandardError => e
      Logger.error('Failed to populate UNSORTED tab', e)
      Result.failure(["Failed to populate UNSORTED tab: #{e.message}"])
    end

    def clear_sheet(tab_name)
      Logger.debug('Clearing sheet', { tab: tab_name })

      sheets_api.clear_sheet(recruitment_spreadsheet_id, tab_name)
      nil # Success
    rescue StandardError => e
      Logger.error('Failed to clear sheet', e, { tab: tab_name })
      Result.failure(["Failed to clear sheet #{tab_name}: #{e.message}"])
    end

    def build_unsorted_tab_data(new_profiles_by_tab)
      rows = []
      header_rows = []
      instrument_rows = []

      # Add multi-line header
      UNSORTED_HEADERS.each do |header_text|
        rows << [header_text]
        header_rows << (rows.length - 1) # Track row index for formatting
      end
      rows << %w[Vet First Last Experience Location Email Status Packet Registered Notes]
      rows << [] # Blank line after header

      # Group profiles by tab
      profiles_by_tab = new_profiles_by_tab.group_by { |item| item[:tab] }

      # Add sections for each tab that has new profiles
      ORIGINAL_TAB_NAMES.each do |tab_name|
        profiles_for_tab = profiles_by_tab[tab_name] || []
        next if profiles_for_tab.empty?

        # Add tab section header
        rows << [tab_name]
        instrument_rows << (rows.length - 1) # Track row index for formatting

        # Add profiles for this tab
        profiles_for_tab.each do |item|
          row = RecruitmentRowBuilder.build_row_for_unsorted(item[:profile], item[:tab])
          rows << row
        end

        # Add blank line between sections
        rows << []
      end

      {
        rows: rows,
        formatting: {
          header_rows: header_rows,
          instrument_rows: instrument_rows
        }
      }
    end

    def format_unsorted_tab(formatting_data)
      Logger.debug('Formatting UNSORTED tab', {
                     header_rows: formatting_data[:header_rows].size,
                     instrument_rows: formatting_data[:instrument_rows].size
                   })

      sheets_api.format_sheet(
        recruitment_spreadsheet_id,
        'UNSORTED',
        formatting_data[:header_rows],
        [], # no subheader rows
        formatting_data[:instrument_rows],
        [] # no registered rows
      )

      nil # Success
    rescue StandardError => e
      Logger.error('Failed to format UNSORTED tab', e)
      Result.failure(["Failed to format UNSORTED tab: #{e.message}"])
    end

    def read_sheet_rows(tab_name)
      sheets_api.read_sheet(recruitment_spreadsheet_id, tab_name)
    rescue StandardError => e
      Logger.error('Failed to read recruitment sheet', e, { tab: tab_name })
      nil
    end

    def write_sheet_rows(tab_name, rows)
      sheets_api.write_sheet(recruitment_spreadsheet_id, tab_name, rows, formulae: true)
      nil # Success
    rescue StandardError => e
      Logger.error('Failed to write recruitment sheet', e, { tab: tab_name })
      Result.failure(["Failed to write recruitment sheet #{tab_name}: #{e.message}"])
    end

    def find_new_profiles_for_instrument(profiles, existing_rows, instrument)
      profiles.select do |profile|
        profile_has_instrument?(profile, instrument) &&
          !profile_exists_in_rows?(profile, existing_rows)
      end
    end

    def profile_has_instrument?(profile, instrument)
      return false unless profile.packet

      # Get instrument from packet if available
      profile.packet.instrument == instrument
    end

    def profile_exists_in_rows?(profile, rows)
      rows.any? { |row| RecruitmentRowBuilder.profile_matches_row?(profile, row) }
    end

    def recruitment_spreadsheet_id
      @recruitment_spreadsheet_id ||= Configuration.recruitment_spreadsheet_id
    end
  end
end
