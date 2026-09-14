# frozen_string_literal: true

# Discover 2025-season audition product names + price structure.
# Run: bundle exec rails runner scripts/auditions_discover_2025.rb

require 'faraday'
require 'json'

ORDERS_URL = 'https://api.squarespace.com/1.0/commerce/orders'
API_KEY = ENV.fetch('SQUARESPACE_API_KEY')
HEADERS = { 'Authorization' => "Bearer #{API_KEY}", 'User-Agent' => 'ruby' }.freeze

START_DATE = '2024-06-01T00:00:00Z'
END_DATE   = '2024-12-01T00:00:00Z'

def fetch_all_orders(start_date, end_date)
  orders = []
  params = { modifiedAfter: start_date, modifiedBefore: end_date }
  loop do
    resp = Faraday.get(ORDERS_URL, params, HEADERS)
    raise "HTTP #{resp.status}: #{resp.body}" unless resp.status == 200

    body = JSON.parse(resp.body)
    orders += body['result']
    break unless body.dig('pagination', 'hasNextPage')

    params = { cursor: body['pagination']['nextPageCursor'] }
  end
  orders
end

orders = fetch_all_orders(START_DATE, END_DATE)
puts "#{orders.size} orders in #{START_DATE[0,10]}..#{END_DATE[0,10]}"

products = Hash.new { |h, k| h[k] = { count: 0, prices: Hash.new(0), promos: Hash.new(0), first: nil, last: nil } }
orders.each do |o|
  date = o['createdOn']
  Array(o['lineItems']).each do |li|
    name = li['productName']
    p = products[name]
    p[:count] += 1
    p[:prices][li.dig('unitPricePaid', 'value')] += 1
    Array(o['discountLines']).each { |d| p[:promos][d['promoCode'] || d['name']] += 1 }
    p[:first] = date if p[:first].nil? || date < p[:first]
    p[:last] = date if p[:last].nil? || date > p[:last]
  end
end

products.sort_by { |_, v| -v[:count] }.each do |name, v|
  next if v[:count] < 2

  puts "\n#{name}  (#{v[:count]})"
  puts "  prices: #{v[:prices]}"
  puts "  promos: #{v[:promos]}" unless v[:promos].empty?
  puts "  span:   #{v[:first]}  ..  #{v[:last]}"
end
