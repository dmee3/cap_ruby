# frozen_string_literal: true

module Auditions
  class DataFetcher
    def initialize(api_client: External::SquarespaceApi, validator: DataValidator)
      @api_client = api_client
      @validator = validator
    end

    def call
      Logger.step('Fetch and validate orders from API') do
        fetch_and_validate_orders
      end
    end

    private

    attr_reader :api_client, :validator

    def fetch_and_validate_orders
      # Fetch orders from API
      orders_result = fetch_orders_with_error_handling
      return orders_result if orders_result.failure?

      # Validate the orders data
      validation_result = validator.validate_orders(orders_result.data)
      return validation_result if validation_result.failure?

      Logger.info('Orders fetched and validated successfully', {
                    order_count: orders_result.data.size
                  })

      Result.success(orders_result.data)
    end

    def fetch_orders_with_error_handling
      Logger.debug('Fetching orders from Squarespace API')
      orders = api_client.orders
      Result.success(orders)
    rescue External::ApiErrors::TooManyRequests => e
      Logger.error('Rate limited by Squarespace API', e)
      Result.failure(['Rate limited by Squarespace API. Please try again later.'])
    rescue Faraday::TimeoutError => e
      Logger.error('Timeout connecting to Squarespace API', e)
      Result.failure(['Connection timeout to Squarespace API'])
    rescue Faraday::ConnectionFailed => e
      Logger.error('Failed to connect to Squarespace API', e)
      Result.failure(['Failed to connect to Squarespace API.'])
    rescue JSON::ParserError => e
      Logger.error('Invalid JSON response from Squarespace API', e)
      Result.failure(['Received invalid response from Squarespace API. The service may be experiencing issues.'])
    rescue StandardError => e
      Logger.error('Unexpected error fetching orders', e)
      Result.failure(["Unexpected error connecting to Squarespace API: #{e.message}"])
    end
  end
end
