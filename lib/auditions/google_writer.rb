# frozen_string_literal: true

require 'google/apis/sheets_v4'

# rubocop:disable Metrics/ClassLength
class GoogleWriter
  include Singleton

  SPREADSHEET_ID = ENV['AUDITIONS_SPREADSHEET_ID']

  class << self
    def write_registrations(registrations)
      instance.write_registrations(registrations)
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

    # Turn raw packet objects into an array of { range: range_name, values: packet_rows }
    # then magically parse out the header row for each range
    data = data_for_sheet(packet_data_rows(packets), 'Packets')
    header_rows = data.map { |d| d[:range][/A(\d+)/, 1].to_i }

    write_sheet(data, header_rows, sheet_id)
  end

  def write_registrations(registrations)
    current_sheet = sheets.find { |s| s.properties.title == 'Registrations' }
    sheet_id = current_sheet.properties.sheet_id

    # Turn raw packet objects into an array of { range: range_name, values: registration_rows }
    # then magically parse out the header row for each range
    data = data_for_sheet(registration_data_rows(registrations), 'Registrations')
    header_rows = data.map { |d| d[:range][/A(\d+)/, 1].to_i }

    write_sheet(data, header_rows, sheet_id)
  end

  private

  attr_reader :service

  def sheets
    return @sheets if @sheets

    @sheets = service.get_spreadsheet(SPREADSHEET_ID).sheets
  end

  def sheet_metadata(id)
    @sheet_metadata ||= {}
    return @sheet_metadata[id] if @sheet_metadata[id].present?

    current = sheets.find { |s| s.properties.sheet_id == id }
    props = current.properties
    @sheet_metadata[id] = {
      name: props.title,
      cols: props.grid_properties.column_count,
      rows: props.grid_properties.row_count,
      last_col_letter: (65 + props.grid_properties.column_count - 1).chr
    }

    @sheet_metadata[id]
  end

  def write_sheet(data, header_rows, sheet_id)
    sheet_info = sheet_metadata(sheet_id)
    return false unless clear_data(sheet_info)
    return false unless reset_formatting(sheet_id, header_rows)

    batch_update_values = Google::Apis::SheetsV4::BatchUpdateValuesRequest.new(
      data: data,
      value_input_option: 'RAW'
    )
    result = service.batch_update_values(SPREADSHEET_ID, batch_update_values)
    return false if !result

    true
  end

  def data_for_sheet(item_data, sheet_name)
    [].tap do |data|
      start_row_idx = 1
      item_data.each do |section|
        end_row_idx = start_row_idx + section[:rows].length
        range_name = "'#{sheet_name}'!A#{start_row_idx}:Z#{end_row_idx}"
        data << { range: range_name, values: [[section[:name].pluralize]] + section[:rows] }
        start_row_idx = end_row_idx + 2
      end
    end
  end

  def packet_data_rows(items)
    items.map(&:type).uniq.sort.map do |type|
      section_items = items
        .select { |p| p.type == type }
        .sort_by { |p| [-p.date.to_i, p.name] }
        .map!(&:to_row)

      { name: type, rows: section_items }
    end
  end

  def registration_data_rows(items)
    items.map(&:type).uniq.sort.map do |type|
      section_items = items
        .select { |p| p.type == type }
        .sort_by { |p| [-p.date.to_i, p.name] }
        .map!(&:to_row)

      { name: type, rows: section_items }
    end
  end

  # Clear all data from cells on a sheet
  def clear_data(sheet_info)
    request_body = Google::Apis::SheetsV4::ClearValuesRequest.new
    service.clear_values(
      SPREADSHEET_ID,
      "'#{sheet_info[:name]}'!A1:Z#{sheet_info[:rows]}",
      request_body
    )
  end

  # This method resets a sheet by:
  #   1. Unmerging all cells
  #   2. Clearing formatting for all cells
  #   3. Merging and formatting all instrument header rows
  def reset_formatting(sheet_id, header_rows)
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
    # if registered_emails
    #   rows_to_highlight = highlight_registered_rows(registered_emails, data, sheet_id)
    #   if rows_to_highlight
    #     requests += rows_to_highlight.map do |r|
    #       format_registered_row_request_body(sheet_id, r)
    #     end
    #   end
    # end

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
# rubocop:enable Metrics/ClassLength
