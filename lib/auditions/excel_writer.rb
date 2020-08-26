module Auditions
  class ExcelWriter
    class << self
      def write(packets, registrations)
        new(packets, registrations).write_file
      end
    end

    def initialize(packets, registrations)
      @packets = packets
      @registrations = registrations
      @excel_file = Axlsx::Package.new
      @wb = @excel_file.workbook
      set_styles
    end

    def write_file
      @registrations.each do |name, instruments|
        @wb.add_worksheet(name: name) do |sheet|
          sheet.add_row(Registration.header_row, style: [@header_style] * Registration.header_row.length)
          row_idx = 1

          # Write data
          instruments.each_key do |instr|

            # Add current instrument header row
            sheet.add_row([])
            sheet.add_row([instr], style: @instr_style)
            row_idx += 2
            sheet.merge_cells("A#{row_idx}:H#{row_idx}")

            # Add registrations for current instrument
            instruments[instr].each do |r|
              sheet.add_row(r.to_row, style: [@normal_style] * (Registration.header_row.length - 1) + [@normal_wrap_style])
              row_idx += 1
            end
          end

          [[0, 9], [1, 20], [2, 25], [3, 12], [4, 6], [5, 10], [6, 12], [7, 100]].each do |pair|
            sheet.column_info[pair[0]].width = pair[1]
          end
        end
      end

      @packets.each do |name, instruments|
        @wb.add_worksheet(name: name) do |sheet|
          sheet.add_row(Packet.header_row, style: [@header_style] * Packet.header_row.length)
          row_idx = 1

          # Write data
          instruments.each_key do |instr|

            # Add current instrument header row
            sheet.add_row([])
            sheet.add_row([instr], style: @instr_style)
            row_idx += 2
            sheet.merge_cells("A#{row_idx}:F#{row_idx}")

            # Add packets for current instrument
            instruments[instr].each do |p|
              sheet.add_row(p.to_row, style: [@normal_style] * Packet.header_row.length)
              row_idx += 1
            end
          end

          [[0, 9], [1, 18], [2, 25], [3, 12], [4, 6], [5, 12]].each do |pair|
            sheet.column_info[pair[0]].width = pair[1]
          end
        end
      end

      @excel_file.serialize('registrations-and-packets.xlsx')
    end

    private

    def set_styles
      @header_style = @wb.styles.add_style(bg_color: '323337', fg_color: 'FFFFFF', b: true, font_name: 'Roboto', sz: 10)
      @instr_style = @wb.styles.add_style(bg_color: 'CCCCCC', b: true, font_name: 'Roboto', sz: 12, alignment: { horizontal: :center })
      @normal_style = @wb.styles.add_style(font_name: 'Roboto', sz: 10)
      @normal_wrap_style = @wb.styles.add_style(font_name: 'Roboto', sz: 10, alignment: { wrap_text: true })
    end
  end
end
