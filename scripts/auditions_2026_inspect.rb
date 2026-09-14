# frozen_string_literal: true

# Inspect raw Squarespace order/line-item structure for the 2026 audition window.
# Run: bundle exec rails runner scripts/auditions_2026_inspect.rb

require 'faraday'
require 'json'

ORDERS_URL = 'https://api.squarespace.com/1.0/commerce/orders'
API_KEY = ENV.fetch('SQUARESPACE_API_KEY')
HEADERS = { 'Authorization' => "Bearer #{API_KEY}", 'User-Agent' => 'ruby' }.freeze

START_DATE = '2025-06-01T00:00:00Z'
END_DATE   = '2025-11-05T00:00:00Z'

REG_PRODUCTS = ['CC26 Music Ensemble Audition Registration', 'CC26 Visual Ensemble Audition Registration'].freeze
MUSIC = 'CC26 Music Ensemble Audition Registration'

def fetch_all_orders
  orders = []
  params = { modifiedAfter: START_DATE, modifiedBefore: END_DATE }
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

orders = fetch_all_orders
puts "#{orders.size} orders total in #{START_DATE}..#{END_DATE}"

reg_orders = orders.select { |o| Array(o['lineItems']).any? { |li| REG_PRODUCTS.include?(li['productName']) } }
              .sort_by { |o| o['createdOn'] }

puts "\n--- 1 full order with a discount, full JSON ---"
sample = reg_orders.find { |o| o.dig('discountTotal', 'value').to_f > 0 }
puts JSON.pretty_generate(sample) if sample

puts "\n--- All registration orders: date | product | unitPricePaid | discountTotal | discountLines | grandTotal ---"
reg_orders.each do |o|
  li = Array(o['lineItems']).find { |x| REG_PRODUCTS.include?(x['productName']) }
  prod = li['productName'] == MUSIC ? 'MUSIC ' : 'VISUAL'
  dlines = Array(o['discountLines']).map { |d| "#{d['name']}=#{d['amount'] || d.dig('amount', 'value')}" }
  puts [
    o['createdOn'][0, 16],
    prod,
    "unit=#{li.dig('unitPricePaid', 'value')}",
    "disc=#{o.dig('discountTotal', 'value')}",
    "grand=#{o.dig('grandTotal', 'value')}",
    "lines=#{dlines.join(',')}"
  ].join('  ')
end
