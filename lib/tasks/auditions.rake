# frozen_string_literal: true

namespace :auditions do
  desc 'Fetch new Squarespace orders and update the auditions spreadsheets'
  task update_spreadsheet: :environment do
    result = Auditions::SpreadsheetService.update

    if result.success?
      Rails.logger.info("[AUDITIONS] Spreadsheet update successful: #{result.data}")
    else
      Rails.logger.error("[AUDITIONS] Spreadsheet update failed: #{result.errors.join(', ')}")
      exit 1
    end
  rescue StandardError => e
    Rails.logger.error("[AUDITIONS] Unexpected error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    exit 1
  end
end
