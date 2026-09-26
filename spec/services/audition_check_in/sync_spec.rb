# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AuditionCheckIn::Sync do
  subject(:sync) do
    described_class.new(sheets_api: sheets_api, check_in_spreadsheet_id: 'check-in-id',
                        feedback_spreadsheet_id: 'feedback-id', registrations_spreadsheet_id: 'registrations-id')
  end

  let(:sheets_api) { class_double(External::GoogleSheetsApi) }
  let(:check_in_header) { ['Timestamp', 'First Name', 'Last Name', 'Instrument', 'Email', 'Selfie'] }
  let(:check_ins) { [] }
  let(:feedback_header) { described_class::FEEDBACK_HEADER.dup }
  let(:registration_header) do
    ['First Name', 'Last Name', 'Email', 'Phone', 'City', 'State', 'Pronouns', 'Shoe', 'Shirt',
     'Birthdate', 'Purchased', 'Experience', 'Conflicts']
  end
  # Laid out the way the auditions sync writes the tab
  let(:registrations) do
    [
      ['Music Registration (2 registrations)'],
      registration_header,
      ['Snare'],
      registration('Sam', 'Reed', 'sam.reed@example.com', 'he/him', '5/1/2009'),
      ['Marimba'],
      registration('Ana Maria', 'Lopez', 'ana@example.com', 'she/her', '11/30/2008'),
      [],
      ['Visual Registration (1 registrations)'],
      registration_header,
      ['Visual Ensemble'],
      registration('Jo', 'Park', 'jo.park@example.com', 'they/them', '2/14/2007')
    ]
  end
  let(:written) { {} }

  before do
    allow(sheets_api).to receive(:read_sheet_with_dates)
      .with('check-in-id', 'Form Responses 1').and_return([check_in_header, *check_ins])
    allow(sheets_api).to receive(:read_sheet_with_dates)
      .with('registrations-id', 'Registrations').and_return(registrations)
    described_class::INSTRUMENT_TABS.each_value do |tab|
      allow(sheets_api).to receive(:read_sheet).with('feedback-id', tab).and_return([feedback_header])
    end
    allow(sheets_api).to receive(:replace_rows_below_header) { |_id, rows_by_tab| written.merge!(rows_by_tab) }
  end

  def registration(first, last, email, pronouns, birthday)
    [first, last, email, '(614) 555-0100', 'Columbus', 'OH', pronouns, '10', 'M', birthday, '9/1 9:00 am', '', '']
  end

  def check_in(first, last, instrument, email, selfie = 'https://drive.google.com/open?id=abc')
    ['9/26/2026 9:00:00', first, last, instrument, email, selfie]
  end

  context 'with check-ins across instruments' do
    let(:check_ins) do
      [
        check_in('Sam', 'Reed', 'Snare', 'sam.reed@example.com'),
        check_in('Jo', 'Park', 'Visual Ensemble', 'jo.park@example.com'),
        check_in('Kai', 'Moss', 'Bass Drum', 'kai@example.com')
      ]
    end

    it 'writes each person to their instrument tab in feedback-sheet column order' do
      sync.call

      expect(written['SNARE']).to eq(
        [['Sam', 'Reed', 'he/him', 'sam.reed@example.com', '5/1/2009', '', 'https://drive.google.com/open?id=abc']]
      )
      expect(written['VE'].first.first(2)).to eq(%w[Jo Park])
      expect(written['BASS'].first.first(2)).to eq(%w[Kai Moss])
    end

    it 'clears every tab, including ones nobody checked in for' do
      sync.call

      expect(written.keys).to match_array(described_class::INSTRUMENT_TABS.values)
      expect(written['MALLETS']).to eq([])
    end

    it 'reports how many were written and matched' do
      report = sync.call

      expect(report.people_written).to eq(3)
      expect(report.written).to include('SNARE' => 1, 'VE' => 1, 'BASS' => 1, 'TENORS' => 0)
      expect([report.matched, report.unmatched]).to eq([2, 1])
    end
  end

  describe 'matching a check-in to a registration' do
    it 'matches on first and last name regardless of case and spacing' do
      allow(sheets_api).to receive(:read_sheet_with_dates).with('check-in-id', 'Form Responses 1')
                                                          .and_return([check_in_header,
                                                                       check_in(' ana  maria', 'LOPEZ', 'Mallets',
                                                                                'different@example.com')])
      sync.call

      expect(written['MALLETS'].first.values_at(2, 4)).to eq(['she/her', '11/30/2008'])
    end

    it 'falls back to email when the name was written differently' do
      allow(sheets_api).to receive(:read_sheet_with_dates).with('check-in-id', 'Form Responses 1')
                                                          .and_return([check_in_header,
                                                                       check_in('Samuel', 'Reed', 'Snare',
                                                                                'Sam.Reed@example.com')])
      sync.call

      expect(written['SNARE'].first.values_at(2, 4)).to eq(['he/him', '5/1/2009'])
    end

    it 'still writes someone with no registration, leaving pronouns and birthday blank' do
      allow(sheets_api).to receive(:read_sheet_with_dates).with('check-in-id', 'Form Responses 1')
                                                          .and_return([check_in_header,
                                                                       check_in('New', 'Person', 'Tenors',
                                                                                'new@example.com')])
      report = sync.call

      expect(written['TENORS']).to eq([['New', 'Person', '', 'new@example.com', '', '',
                                        'https://drive.google.com/open?id=abc']])
      expect(report.unmatched).to eq(1)
    end
  end

  context 'when someone checks in twice' do
    let(:check_ins) do
      [
        check_in('Sam', 'Reed', 'Tenors', 'sam.reed@example.com'),
        check_in('Kai', 'Moss', 'Snare', 'kai@example.com'),
        check_in('Sam', 'Reed', 'Snare', 'SAM.REED@example.com')
      ]
    end

    it 'keeps only their latest check-in' do
      report = sync.call

      expect(written['TENORS']).to eq([])
      expect(written['SNARE'].map(&:first)).to eq(%w[Kai Sam])
      expect(report.duplicates).to eq(1)
    end
  end

  context 'with several people on one tab' do
    let(:check_ins) do
      [
        check_in('sam', 'Reed', 'Snare', 'sam@example.com'),
        check_in('Alex', 'Young', 'Snare', 'alex.y@example.com'),
        check_in('Blair', 'Cho', 'Snare', 'blair@example.com'),
        check_in('Alex', 'Adams', 'Snare', 'alex.a@example.com')
      ]
    end

    it 'sorts them by first name, then last name, ignoring case' do
      sync.call

      expect(written['SNARE'].map { |row| row.first(2).join(' ') }).to eq(
        ['Alex Adams', 'Alex Young', 'Blair Cho', 'sam Reed']
      )
    end
  end

  context 'when an instrument has no tab' do
    let(:check_ins) { [check_in('Pat', 'Kim', 'Triangle', 'pat@example.com')] }

    it 'leaves them off and reports the instrument' do
      report = sync.call

      expect(written.values.flatten).to be_empty
      expect(report.unknown_instruments).to eq('Triangle' => 1)
    end
  end

  context 'when a check-in field looks like a formula' do
    let(:check_ins) { [check_in('=IMPORTXML("https://evil.example")', 'Reed', 'Snare', 'x@example.com', '=1+1')] }

    it 'writes it as text' do
      sync.call

      expect(written['SNARE'].first.values_at(0, 6)).to eq(['\'=IMPORTXML("https://evil.example")', "'=1+1"])
    end
  end

  context "when a feedback tab's columns have changed" do
    let(:check_ins) { [check_in('Sam', 'Reed', 'Snare', 'sam.reed@example.com')] }

    before do
      allow(sheets_api).to receive(:read_sheet).with('feedback-id', 'AUX')
                                               .and_return([['First Name', 'Last Name', 'Email', 'Feedback']])
    end

    it 'refuses before clearing anything' do
      expect { sync.call }.to raise_error(AuditionCheckIn::Error, /AUX tab doesn't have the expected columns/)
      expect(sheets_api).not_to have_received(:replace_rows_below_header)
    end
  end

  context 'when the check-in form has lost a column' do
    let(:check_in_header) { ['Timestamp', 'First Name', 'Last Name', 'Email', 'Selfie'] }

    it 'refuses before clearing anything' do
      expect { sync.call }.to raise_error(AuditionCheckIn::Error, /no 'Instrument' column/)
      expect(sheets_api).not_to have_received(:replace_rows_below_header)
    end
  end

  it 'names the missing settings when a sheet ID is not configured' do
    unconfigured = described_class.new(sheets_api: sheets_api, check_in_spreadsheet_id: nil,
                                       feedback_spreadsheet_id: 'feedback-id',
                                       registrations_spreadsheet_id: '')

    expect { unconfigured.call }.to raise_error(
      AuditionCheckIn::Error, 'Not configured: set AUDITION_CHECK_IN_SPREADSHEET_ID, AUDITIONS_SPREADSHEET_ID'
    )
  end
end
