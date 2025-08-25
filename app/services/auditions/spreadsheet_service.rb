# frozen_string_literal: true

module Auditions
  class SpreadsheetService
    def initialize(orchestrator: Orchestrator.new)
      @orchestrator = orchestrator
    end

    class << self
      def update
        new.update
      end
    end

    def update
      Logger.step('Auditions spreadsheet update') do
        # Delegate to the new orchestrated architecture
        result = @orchestrator.call
        return result if result.failure?

        # Transform result to maintain backward compatibility
        Logger.info('Spreadsheet update completed successfully', {
                      profiles_count: result.data[:profiles_count],
                      registrations_count: result.data[:registrations_count],
                      packets_count: result.data[:packets_count]
                    })

        Result.success({
                         registrations_processed: result.data[:registrations_count],
                         packets_processed: result.data[:packets_count],
                         profiles_created: result.data[:profiles_count]
                       })
      end
    rescue StandardError => e
      Logger.error('Unexpected error in spreadsheet update', e)
      Result.failure(["Unexpected error during spreadsheet update: #{e.message}"])
    end
  end
end
