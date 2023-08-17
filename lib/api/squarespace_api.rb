# frozen_string_literal: true

class SquarespaceApi
  API_KEY = ENV['SQUARESPACE_API_KEY']
  ORDERS_URL = 'https://api.squarespace.com/1.0/commerce/orders'
  HEADERS = { 'Authorization' => "Bearer #{API_KEY}", 'User-Agent' => 'ruby' }.freeze
  ORDER_START_DATE = '2023-08-14T12:00:00Z'
  ORDER_END_DATE = '2023-11-01T12:30:00Z'

  class << self
    def orders
      url_params = { modifiedAfter: ORDER_START_DATE, modifiedBefore: ORDER_END_DATE }
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
  end
end
