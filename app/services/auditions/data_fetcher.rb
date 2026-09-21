# frozen_string_literal: true

module Auditions
  class DataFetcher
    CANCELED_FULFILLMENT_STATUS = 'CANCELED'

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

      orders = reject_canceled_orders(orders_result.data)

      # Validate the orders data
      validation_result = validator.validate_orders(orders)
      return validation_result if validation_result.failure?

      Logger.info('Orders fetched and validated successfully', {
                    order_count: orders.size
                  })

      Result.success(orders)
    end

    # Dropped before validation, not after: a canceled order that is also malformed
    # would otherwise fail the whole run over line items nobody is going to read.
    def reject_canceled_orders(orders)
      return orders unless orders.is_a?(Array)

      canceled, kept = orders.partition { |order| canceled?(order) }

      if canceled.any?
        Logger.info('Excluded canceled orders', {
                      canceled_count: canceled.size,
                      order_numbers: canceled.map { |order| order['orderNumber'] }.compact
                    })
      end

      kept
    end

    def canceled?(order)
      order.is_a?(Hash) && order['fulfillmentStatus'].to_s.upcase == CANCELED_FULFILLMENT_STATUS
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
