# frozen_string_literal: true

require 'google/apis/sheets_v4'

class GoogleWriter
  include Singleton

  SPREADSHEET_ID = ENV['AUDITIONS_SPREADSHEET_ID']

  class << self
    def write_registrations(registrations)
      #instance.write_sheet('Registrations', registrations)
    end

    def write_packets(packets, registered_emails)
      instance.write_packets(packets, registered_emails)
    end
  end

  def initialize
    scope = Google::Apis::SheetsV4::AUTH_SPREADSHEETS
    authorization = Google::Auth.get_application_default(scope)

    # Initialize the API
    @service = Google::Apis::SheetsV4::SheetsService.new
    service.authorization = authorization
  end

  def write_packets(packets, registered_emails)
    current_sheet = sheets.find { |s| s.properties.title == 'Packets' }
    sheet_id = current_sheet.properties.sheet_id
    sheet_cols = current_sheet.properties.grid_properties.column_count
    sheet_rows = current_sheet.properties.grid_properties.row_count
    last_col_letter = (65 + sheet_cols - 1).chr

    data = []
    header_rows = []
    start_row_idx = 1
    packets.map(&:type).uniq.sort.each do |type|
      packet_type_rows = packets
        .select { |p| p.type == type }
        .sort_by { |p| [p.instrument, p.name] }
        .map!(&:to_row)
      end_row_idx = start_row_idx + packet_type_rows.length
      range_name = "'Packets'!A#{start_row_idx}:#{last_col_letter}#{end_row_idx}"
      data << { range: range_name, values: [[type]] + packet_type_rows }

      header_rows << start_row_idx
      start_row_idx = end_row_idx + 2
    end

    return false unless reset_sheet(
      sheet_id, last_col_letter, sheet_rows, header_rows, data, registered_emails)
    )

    batch_update_values = Google::Apis::SheetsV4::BatchUpdateValuesRequest.new(
      data:               data,
      value_input_option: 'RAW'
    )

    result = reset_formatting(sheet_id, header_rows, data, registered_emails)
    return false if !result

    result = service.batch_update_values(SPREADSHEET_ID, batch_update_values)
    return false if !result

    true
  end

  def write_sheet(sheet_name, instruments, registered_emails = nil)

    # Find current sheet by name and get properties
    current_sheet = sheets.find { |s| s.properties.title == sheet_name }
    sheet_id = current_sheet.properties.sheet_id
    sheet_columns = current_sheet.properties.grid_properties.column_count
    sheet_rows = current_sheet.properties.grid_properties.row_count
    last_col_letter = (65 + sheet_columns - 1).chr

    # Organize data for ranges and record header rows
    start_row_idx = 3
    header_rows = []
    data = []
    instruments.each do |name, items|
      values = [[name]] + items.map { |i| i.to_row }
      end_row_idx = start_row_idx + values.length
      range_name = "'#{sheet_name}'!A#{start_row_idx}:#{last_col_letter}#{end_row_idx}"
      data << { range: range_name, values: values }

      header_rows << start_row_idx
      start_row_idx = end_row_idx + 1
    end

    # Reset sheet and format for new data
    result = clear_data(sheet_name, last_col_letter, sheet_rows)
    return false if !result

    result = reset_formatting(sheet_id, header_rows, data, registered_emails)
    return false if !result

    # Send new data
    batch_update_values = Google::Apis::SheetsV4::BatchUpdateValuesRequest.new(
      data:               data,
      value_input_option: 'RAW'
    )
    result = service.batch_update_values(SPREADSHEET_ID, batch_update_values)
    return false if !result

    return true
  end

  private

  attr_reader :service

  def sheets
    return @sheets if @sheets
    result = service.get_spreadsheet(SPREADSHEET_ID)
    @sheets = result.sheets
  end

  def sheet_info(id)
    @sheet_info ||= {}
    return @sheet_info[id] if @sheet_info[id].present?

    current = sheets.find { |s| s.properties.sheet_id == id }
    @sheet_info[id] = {
      cols: current.properties.grid_properties.column_count
      rows: current.properties.grid_properties.row_count
      last_col_letter: (65 + current.properties.grid_properties.column_count - 1).chr
    }

    @sheet_info[id]
  end

  # Clear all data from cells on a sheet
  def clear_data(sheet_name, last_col_letter, sheet_rows)
    request_body = Google::Apis::SheetsV4::ClearValuesRequest.new
    response = service.clear_values(
      SPREADSHEET_ID,
      "'#{sheet_name}'!A2:#{last_col_letter}#{sheet_rows}",
      request_body
    )
  end

  # This method resets a sheet by:
  #   1. Unmerging all cells
  #   2. Clearing formatting for all cells
  #   3. Merging and formatting all instrument header rows
  def reset_formatting(sheet_id, header_rows, data, registered_emails)
    requests = [
      unmerge_all_cells_request_body(sheet_id),
      clear_all_cells_format_request_body(sheet_id)
    ]
    requests += header_rows.map do |h|
      [
        merge_row_request_body(sheet_id, h),
        format_header_row_request_body(sheet_id, h)
      ]
    end.flatten

    # If we're writing packets, highlight rows for people who have registered
    if registered_emails
      rows_to_highlight = highlight_registered_rows(registered_emails, data, sheet_id)
      if rows_to_highlight
        requests += rows_to_highlight.map do |r|
          format_registered_row_request_body(sheet_id, r)
        end
      end
    end

    body = { requests: requests }
    result = service.batch_update_spreadsheet(SPREADSHEET_ID, body, {})
  end

  def highlight_registered_rows(emails, data, sheet_id)
    rows_to_highlight = []
    data.each do |curr_section|
      first_row = curr_section[:range].match(/!A(\d+)/)[1].to_i
      curr_section[:values].each.with_index do |row, idx|
        rows_to_highlight << (first_row + idx) if row[2] && emails.include?(row[2])
      end
    end

    return rows_to_highlight
  end

  def merge_row_request_body(sheet_id, row_idx)
    {
      merge_cells: {
        range: {
          sheet_id: sheet_id,
          start_row_index: row_idx - 1,
          end_row_index: row_idx,
          start_column_index: 0,
          end_column_index: 1000
        },
        merge_type: "MERGE_ALL"
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
            horizontal_alignment: "LEFT",
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
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
      }
    }
  end

  def format_header_row_request_body(sheet_id, row_idx)
    {
      repeat_cell: {
        range: {
          sheet_id: sheet_id,
          start_row_index: row_idx - 1,
          end_row_index: row_idx
        },
        cell: {
          user_entered_format: {
            background_color: {
              red: 0.81,
              green: 0.81,
              blue: 0.81
            },
            horizontal_alignment: "CENTER",
            text_format: {
              foreground_color: {
                red: 0.0,
                green: 0.0,
                blue: 0.0
              },
              font_size: 12,
              bold: true
            }
          }
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
      }
    }
  end

  def format_registered_row_request_body(sheet_id, row_idx)
    {
      repeat_cell: {
        range: {
          sheet_id: sheet_id,
          start_row_index: row_idx - 1,
          end_row_index: row_idx
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
        fields: "userEnteredFormat(backgroundColor,textFormat)"
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