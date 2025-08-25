# frozen_string_literal: true

module Auditions
  class Orchestrator
    def initialize(
      data_fetcher: DataFetcher.new,
      profile_builder: ProfileBuilder.new,
      sheet_writer: SheetWriter.new,
      recruitment_updater: RecruitmentUpdater.new
    )
      @data_fetcher = data_fetcher
      @profile_builder = profile_builder
      @sheet_writer = sheet_writer
      @recruitment_updater = recruitment_updater
    end

    def call
      Logger.step('Execute auditions data processing workflow') do
        execute_workflow
      end
    end

    private

    attr_reader :data_fetcher, :profile_builder, :sheet_writer, :recruitment_updater

    def execute_workflow
      # Step 1: Fetch and validate orders from API
      orders_result = data_fetcher.call
      return orders_result if orders_result.failure?

      # Step 2: Build profiles from the order data
      profile_result = profile_builder.call(orders_result.data)
      return profile_result if profile_result.failure?

      # Step 3: Write profiles to spreadsheets
      sheet_result = sheet_writer.call(profile_result.data[:profiles])
      return sheet_result if sheet_result.failure?

      # Step 4: Update recruitment spreadsheets (optional - only if configured)
      recruitment_result = nil
      if Configuration.recruitment_spreadsheet_id
        recruitment_result = recruitment_updater.call(profile_result.data[:profiles])
        return recruitment_result if recruitment_result&.failure?
      else
        Logger.debug('Skipping recruitment sheet update - no recruitment spreadsheet ID configured')
      end

      # Success! Return comprehensive results
      Logger.info('Auditions workflow completed successfully', {
                    orders_processed: orders_result.data.size,
                    profiles_created: profile_result.data[:profiles].size,
                    registrations: profile_result.data[:registrations].size,
                    packets: profile_result.data[:packets].size
                  })

      Result.success({
                       orders_count: orders_result.data.size,
                       profiles_count: profile_result.data[:profiles].size,
                       registrations_count: profile_result.data[:registrations].size,
                       packets_count: profile_result.data[:packets].size,
                       sheets_updated: sheet_result.data,
                       recruitment_updated: recruitment_result&.success? || false
                     })
    end
  end
end
