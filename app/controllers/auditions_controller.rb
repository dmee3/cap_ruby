# frozen_string_literal: true

class AuditionsController < ApplicationController
  def index; end

  def update
    result = Auditions::SpreadsheetService.update
    
    if result.success?
      # Log success metrics for monitoring
      Rails.logger.info("[AUDITIONS] Spreadsheet update successful: #{result.data}")
      render 'auditions/success'
    else
      # Log failure details for debugging
      Rails.logger.error("[AUDITIONS] Spreadsheet update failed: #{result.errors.join(', ')}")
      
      # Check for specific error types to render appropriate views
      if result.errors.any? { |error| error.include?('Rate limited') }
        render 'auditions/rate_limited'
      else
        # Store errors in flash for potential display to user
        flash.now[:alert] = "Update failed: #{result.errors.join(', ')}"
        render 'auditions/google_failure'
      end
    end
  rescue => e
    # Catch any unexpected errors that weren't handled by our Result system
    Rails.logger.error("[AUDITIONS] Unexpected controller error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    flash.now[:alert] = "An unexpected error occurred. Please try again."
    render 'auditions/google_failure'
  end
end
