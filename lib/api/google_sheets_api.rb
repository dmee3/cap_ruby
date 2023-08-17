# frozen_string_literal: true

require 'google/apis/sheets_v4'

# rubocop:disable Metrics/ClassLength
# rubocop:disable Metrics/AbcSize
# rubocop:disable Metrics/MethodLength
class GoogleSheetsApi
  include Singleton

  class << self
    def clear_sheet(sheet_id, tab_name)
      instance.clear_sheet(sheet_id, tab_name)
    end

    def format_sheet(sheet_id, tab_name, header_rows, subheader_rows, instrument_rows, registered_rows = [])
      instance.format_sheet(
        sheet_id, tab_name, header_rows, subheader_rows, instrument_rows, registered_rows
      )
    end

    def read_sheet(sheet_id, tab_name)
      data = instance.read_sheet(sheet_id, tab_name)
      return data&.values
    end

    def write_sheet(sheet_id, tab_name, data)
      instance.write_sheet(sheet_id, tab_name, data)
    end
  end

  def initialize
    scope = Google::Apis::SheetsV4::AUTH_SPREADSHEETS
    authorization = Google::Auth.get_application_default(scope)

    # Initialize the API
    @service = Google::Apis::SheetsV4::SheetsService.new
    service.authorization = authorization
  end

  def clear_sheet(sheet_id, tab_name)
    request_body = Google::Apis::SheetsV4::ClearValuesRequest.new
    service.clear_values(sheet_id, "'#{tab_name}'!A1:Z1000", request_body)
  end

  def format_sheet(sheet_id, tab_name, header_rows, subheader_rows, instrument_rows, registered_rows)
    tab_id = tab_name_to_id(sheet_id, tab_name)

    requests = [
      unmerge_all_cells_request_body(tab_id),
      clear_all_cells_format_request_body(tab_id)
    ]

    header_rows.each do |row|
      requests << merge_row_request_body(tab_id, row)
      requests << format_header_row_request_body(tab_id, row)
    end

    subheader_rows.each do |row|
      requests << format_subheader_row_request_body(tab_id, row)
    end

    instrument_rows.each do |row|
      requests << merge_row_request_body(tab_id, row)
      requests << format_instrument_row_request_body(tab_id, row)
    end

    registered_rows.each do |row|
      requests << format_registered_row_request_body(tab_id, row)
    end

    service.batch_update_spreadsheet(sheet_id, { requests: requests }, {})
  end

  def read_sheet(sheet_id, tab_name)
    service.get_spreadsheet_values(sheet_id, "'#{tab_name}'!A1:Z1000")
  end

  def write_sheet(sheet_id, tab_name, values)
    service.batch_update_values(
      sheet_id,
      Google::Apis::SheetsV4::BatchUpdateValuesRequest.new(
        data: [{ range: "'#{tab_name}'!A1:Z1000", values: values }],
        value_input_option: 'RAW'
      )
    )
  end

  private

  attr_reader :service

  def sheets(sheet_id)
    return @sheets if @sheets

    @sheets = service.get_spreadsheet(sheet_id).sheets
  end

  def tab_name_to_id(sheet_id, name)
    current_sheet = sheets(sheet_id).find { |s| s.properties.title == name }
    current_sheet.properties.sheet_id
  end

  def highlight_registered_rows(emails, data, _sheet_id)
    rows_to_highlight = []
    data.each do |curr_section|
      first_row = curr_section[:range].match(/!A(\d+)/)[1].to_i
      curr_section[:values].each.with_index do |row, idx|
        rows_to_highlight << (first_row + idx) if row[2] && emails.include?(row[2])
      end
    end

    rows_to_highlight
  end

  def merge_row_request_body(sheet_id, row_idx)
    {
      merge_cells: {
        range: {
          sheet_id: sheet_id,
          start_row_index: row_idx,
          end_row_index: row_idx + 1,
          start_column_index: 0,
          end_column_index: 1000
        },
        merge_type: 'MERGE_ALL'
      }
    }
  end

  def clear_all_cells_format_request_body(sheet_id)
    {
      repeat_cell: {
        range: {
          sheet_id: sheet_id,
          start_row_index: 1,
          end_row_index: 1000
        },
        cell: {
          user_entered_format: {
            background_color: {
              red: 1.0,
              green: 1.0,
              blue: 1.0
            },
            horizontal_alignment: 'LEFT',
            text_format: {
              foreground_color: {
                red: 0.0,
                green: 0.0,
                blue: 0.0
              },
              font_size: 10,
              bold: false
            }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
      }
    }
  end

  def format_header_row_request_body(sheet_id, row_idx)
    {
      repeat_cell: {
        range: {
          sheet_id: sheet_id,
          start_row_index: row_idx,
          end_row_index: row_idx + 1
        },
        cell: {
          user_entered_format: {
            background_color: {
              red: 0.80,
              green: 0.18,
              blue: 0.27
            },
            horizontal_alignment: 'CENTER',
            text_format: {
              foreground_color: {
                red: 1.0,
                green: 1.0,
                blue: 1.0
              },
              font_size: 12,
              bold: true
            }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
      }
    }
  end

  def format_subheader_row_request_body(sheet_id, row_idx)
    {
      repeat_cell: {
        range: {
          sheet_id: sheet_id,
          start_row_index: row_idx,
          end_row_index: row_idx + 1
        },
        cell: {
          user_entered_format: {
            background_color: {
              red: 0.20,
              green: 0.20,
              blue: 0.22
            },
            text_format: {
              foreground_color: {
                red: 1.0,
                green: 1.0,
                blue: 1.0
              },
              font_size: 10,
              bold: true
            }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)'
      }
    }
  end

  def format_instrument_row_request_body(sheet_id, row_idx)
    {
      repeat_cell: {
        range: {
          sheet_id: sheet_id,
          start_row_index: row_idx,
          end_row_index: row_idx + 1
        },
        cell: {
          user_entered_format: {
            background_color: {
              red: 0.81,
              green: 0.81,
              blue: 0.81
            },
            horizontal_alignment: 'CENTER',
            text_format: {
              foreground_color: {
                red: 0.0,
                green: 0.0,
                blue: 0.0
              },
              font_size: 10,
              bold: true
            }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
      }
    }
  end

  def format_registered_row_request_body(sheet_id, row_idx)
    {
      repeat_cell: {
        range: {
          sheet_id: sheet_id,
          start_row_index: row_idx,
          end_row_index: row_idx + 1
        },
        cell: {
          user_entered_format: {
            background_color: {
              red: 0.576,
              green: 0.769,
              blue: 0.49
            },
            text_format: {
              bold: true
            }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)'
      }
    }
  end

  def unmerge_all_cells_request_body(sheet_id)
    {
      unmerge_cells: {
        range: {
          sheet_id: sheet_id,
          start_row_index: 0,
          end_row_index: 1000,
          start_column_index: 0,
          end_column_index: 1000
        }
      }
    }
  end
end
# rubocop:enable Metrics/MethodLength
# rubocop:enable Metrics/AbcSize
# rubocop:enable Metrics/ClassLength
