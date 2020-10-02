class SquarespaceApi
  API_KEY = ENV['SQUARESPACE_API_KEY']
  ORDERS_URL = 'https://api.squarespace.com/1.0/commerce/orders'.freeze
  HEADERS = { 'Authorization' => "Bearer #{API_KEY}", 'User-Agent' => 'ruby' }.freeze

  class << self
    def get_orders
      url_params = { modifiedAfter: '2020-08-15T12:00:00Z', modifiedBefore: '2020-11-01T12:30:00Z' }
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
