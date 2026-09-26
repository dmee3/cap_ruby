# frozen_string_literal: true

module AuditionCheckIn
  # Rebuilds the audition feedback sheet from the check-in form: every
  # instrument tab is cleared below its header and rewritten from the current
  # check-ins, with pronouns and birthday pulled from the person's registration.
  # It overwrites, so it's for before staff start writing feedback.
  class Sync
    Report = Struct.new(:written, :matched, :unmatched, :duplicates, :unknown_instruments, keyword_init: true) do
      def people_written
        written.values.sum
      end
    end

    # Check-in form answer => feedback sheet tab
    INSTRUMENT_TABS = {
      'Snare' => 'SNARE',
      'Tenors' => 'TENORS',
      'Bass Drum' => 'BASS',
      'Cymbals' => 'CYMBALS',
      'Mallets' => 'MALLETS',
      'Aux (Rack/Kit)' => 'AUX',
      'Electronics' => 'ELECTROS',
      'Visual Ensemble' => 'VE'
    }.freeze

    CHECK_IN_TAB = 'Form Responses 1'
    REGISTRATIONS_TAB = 'Registrations'
    CHECK_IN_COLUMNS = {
      first_name: 'First Name',
      last_name: 'Last Name',
      email: 'Email',
      instrument: 'Instrument',
      selfie: 'Selfie'
    }.freeze
    # Rows are written positionally, so a tab whose header has drifted from
    # this would get the wrong data in the wrong columns.
    FEEDBACK_HEADER = ['First Name', 'Last Name', 'Pronouns', 'Email', 'Birthday', 'Feedback', 'Selfie'].freeze

    # Check-ins come from a public form and rows are written USER_ENTERED, so
    # text starting with one of these would otherwise be evaluated as a formula.
    FORMULA_PREFIXES = %w[= + - @].freeze

    def self.call
      new.call
    end

    def self.feedback_sheet_url
      id = ENV.fetch('AUDITION_FEEDBACK_SPREADSHEET_ID', nil)
      "https://docs.google.com/spreadsheets/d/#{id}/edit" if id.present?
    end

    def initialize(sheets_api: External::GoogleSheetsApi,
                   check_in_spreadsheet_id: ENV.fetch('AUDITION_CHECK_IN_SPREADSHEET_ID', nil),
                   feedback_spreadsheet_id: ENV.fetch('AUDITION_FEEDBACK_SPREADSHEET_ID', nil),
                   registrations_spreadsheet_id: ENV.fetch('AUDITIONS_SPREADSHEET_ID', nil))
      @sheets_api = sheets_api
      @check_in_spreadsheet_id = check_in_spreadsheet_id
      @feedback_spreadsheet_id = feedback_spreadsheet_id
      @registrations_spreadsheet_id = registrations_spreadsheet_id
    end

    def call
      missing = missing_settings
      raise Error, "Not configured: set #{missing.join(', ')}" if missing.any?

      check_ins = latest_check_ins
      verify_feedback_headers
      rows_by_tab, report = build_rows(check_ins[:people], lookup)
      report.duplicates = check_ins[:duplicates]

      sheets_api.replace_rows_below_header(feedback_spreadsheet_id, rows_by_tab)
      Rails.logger.info("[AUDITION CHECK-IN] Feedback sheet rebuilt: #{report.to_h}")
      report
    end

    private

    attr_reader :sheets_api, :check_in_spreadsheet_id, :feedback_spreadsheet_id, :registrations_spreadsheet_id

    def missing_settings
      {
        'AUDITION_CHECK_IN_SPREADSHEET_ID' => check_in_spreadsheet_id,
        'AUDITION_FEEDBACK_SPREADSHEET_ID' => feedback_spreadsheet_id,
        'AUDITIONS_SPREADSHEET_ID' => registrations_spreadsheet_id
      }.select { |_name, value| value.blank? }.keys
    end

    # One row per person, keyed on email; a later response replaces an earlier
    # one (someone re-submitting to fix their instrument) and takes its place
    # in check-in order.
    def latest_check_ins
      header, *rows = sheets_api.read_sheet_with_dates(check_in_spreadsheet_id, CHECK_IN_TAB) || []
      raise Error, "The check-in sheet's '#{CHECK_IN_TAB}' tab is empty" unless header

      columns = CHECK_IN_COLUMNS.transform_values do |label|
        header.index(label) or raise Error, "The check-in sheet has no '#{label}' column"
      end

      people = {}
      rows.each do |row|
        check_in = columns.transform_values { |index| row[index].to_s.strip }
        next if check_in.values.all?(&:empty?)

        key = check_in[:email].downcase.presence || RegistrationLookup.name_key(check_in[:first_name],
                                                                                check_in[:last_name])
        people.delete(key)
        people[key] = check_in
      end

      { people: people.values, duplicates: rows.count { |row| row.any?(&:present?) } - people.size }
    end

    def lookup
      RegistrationLookup.new(sheets_api.read_sheet_with_dates(registrations_spreadsheet_id, REGISTRATIONS_TAB) || [])
    end

    def verify_feedback_headers
      INSTRUMENT_TABS.each_value do |tab|
        header = sheets_api.read_sheet(feedback_spreadsheet_id, tab)&.first
        next if header&.map { |cell| cell.to_s.strip } == FEEDBACK_HEADER

        raise Error, "The feedback sheet's #{tab} tab doesn't have the expected columns " \
                     "(#{FEEDBACK_HEADER.join(', ')}), so nothing was written"
      end
    end

    def build_rows(check_ins, lookup)
      rows_by_tab = INSTRUMENT_TABS.values.index_with { [] }
      report = Report.new(written: {}, matched: 0, unmatched: 0, unknown_instruments: Hash.new(0))

      check_ins.each do |check_in|
        tab = tab_for(check_in[:instrument])
        next report.unknown_instruments[check_in[:instrument]] += 1 unless tab

        registration = lookup.find(**check_in.slice(:first_name, :last_name, :email))
        registration ? report.matched += 1 : report.unmatched += 1
        rows_by_tab[tab] << feedback_row(check_in, registration)
      end

      report.written = rows_by_tab.transform_values(&:size)
      report.unknown_instruments = report.unknown_instruments.to_h
      [rows_by_tab, report]
    end

    def tab_for(instrument)
      INSTRUMENT_TABS.find { |answer, _tab| answer.casecmp?(instrument) }&.last
    end

    def feedback_row(check_in, registration)
      [
        check_in[:first_name],
        check_in[:last_name],
        registration&.pronouns,
        check_in[:email],
        registration&.birthday,
        '',
        check_in[:selfie]
      ].map { |value| plain_text(value) }
    end

    def plain_text(value)
      text = value.to_s
      text.start_with?(*FORMULA_PREFIXES) ? "'#{text}" : text
    end
  end
end
