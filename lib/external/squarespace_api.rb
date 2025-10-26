# frozen_string_literal: true

module External
  class SquarespaceApi
    API_KEY = ENV.fetch('SQUARESPACE_API_KEY', nil)
    ORDERS_URL = 'https://api.squarespace.com/1.0/commerce/orders'
    HEADERS = { 'Authorization' => "Bearer #{API_KEY}", 'User-Agent' => 'ruby' }.freeze

    # Date ranges are now configured in config/auditions/{year}.yml
    # Keep these constants as fallbacks for backwards compatibility
    ORDER_START_DATE = '2025-08-14T12:00:00Z'
    ORDER_END_DATE = '2025-11-01T12:30:00Z'

    class << self
      def orders
        date_range = fetch_date_range
        url_params = { modifiedAfter: date_range[:start_date],
                       modifiedBefore: date_range[:end_date] }
        orders = []
        loop do
          response = Faraday.get(ORDERS_URL, url_params, HEADERS)
          raise ApiErrors::TooManyRequests if response.status == 429

          body = JSON.parse(response.body)
          orders += body['result']

          break unless body['pagination']['hasNextPage']

          url_params = { cursor: body['pagination']['nextPageCursor'] }
        end

        orders
      end

      private

      def fetch_date_range
        # Try to load from configuration, fall back to constants

        require_relative '../../app/services/auditions/configuration'
        Auditions::Configuration.date_range
      rescue StandardError => e
        Rails.logger.warn("[AUDITIONS] Failed to load date range from config, using fallback: #{e.message}")
        {
          start_date: ORDER_START_DATE,
          end_date: ORDER_END_DATE
        }
      end
    end
  end
end
