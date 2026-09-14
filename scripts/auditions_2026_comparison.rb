# frozen_string_literal: true

# One-off analysis: 2027 audition registration pace vs. 2026 season.
#
#  1. Registrations 20 days before auditions:
#     2026 auditions 2025-09-28  ->  cutoff = end of 2025-09-08  (Eastern)
#  2. Registrations as of the day before the price increase.
#     NOTE: 2026 Squarespace data shows NO base-price change in the window
#     (Music Reg was $115 from the first order on). Last year's "sale" was the
#     15FOR15 promo code (15% off). Reporting the promo timeline instead.
#
# Run: bundle exec rails runner scripts/auditions_2026_comparison.rb

require 'faraday'
require 'json'

ORDERS_URL = 'https://api.squarespace.com/1.0/commerce/orders'
API_KEY = ENV.fetch('SQUARESPACE_API_KEY')
HEADERS = { 'Authorization' => "Bearer #{API_KEY}", 'User-Agent' => 'ruby' }.freeze

START_DATE = '2025-06-01T00:00:00Z'
END_DATE   = '2025-11-05T00:00:00Z'

REG_PRODUCTS = ['CC26 Music Ensemble Audition Registration', 'CC26 Visual Ensemble Audition Registration'].freeze
MUSIC = 'CC26 Music Ensemble Audition Registration'
EASTERN = '-04:00' # EDT for Aug/Sep 2025

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

regs = []
orders.each do |order|
  next if order['createdOn'].blank?

  date = DateTime.parse(order['createdOn'])
  Array(order['lineItems']).each do |item|
    next unless REG_PRODUCTS.include?(item['productName'])

    (item['quantity'] || 1).to_i.times do
      regs << {
        date: date,
        email: order['customerEmail']&.downcase,
        product: item['productName'],
        promo: Array(order['discountLines']).map { |d| d['promoCode'] || d['name'] }.first,
        grand: order.dig('grandTotal', 'value')&.to_f
      }
    end
  end
end
regs.sort_by! { |r| r[:date] }

def summarize(rows, label)
  music = rows.count { |r| r[:product] == MUSIC }
  visual = rows.size - music
  people = rows.map { |r| r[:email] }.uniq.size
  puts "#{label}"
  puts "  registration line items: #{rows.size}  (Music #{music} / Visual #{visual})"
  puts "  unique people (by email): #{people}"
end

puts '=' * 70
puts "2026 SEASON — full window #{START_DATE[0,10]}..#{END_DATE[0,10]}"
summarize(regs, 'ALL:')
puts "  first registration: #{regs.first[:date]}"
puts "  last registration:  #{regs.last[:date]}"

puts
puts '=' * 70
puts 'Q1 — 20 days before auditions (auditions 2025-09-28; cutoff = end of 2025-09-08 ET)'
cutoff1 = DateTime.parse("2025-09-08T23:59:59#{EASTERN}")
summarize(regs.select { |r| r[:date] <= cutoff1 }, 'As of 2025-09-08 EOD:')

puts
puts '=' * 70
puts 'Q2 — price / promo timeline'
puts '  Music Reg list price was $115.00 for EVERY order in the window (no base bump).'
puts '  Visual Reg list price was $90.00 for every order.'
puts '  The discount mechanism was promo code 15FOR15 (15% off).'
puts
promo_dates = regs.select { |r| r[:promo].to_s.upcase.include?('15') }.map { |r| r[:date] }
if promo_dates.any?
  puts "  First 15FOR15 use: #{promo_dates.min}"
  puts "  Last  15FOR15 use: #{promo_dates.max}"
end
puts
puts '  Registrations by day (Eastern date) with running total:'
by_day = regs.group_by { |r| (r[:date].new_offset(EASTERN)).to_date }
running = 0
by_day.keys.sort.each do |d|
  day_rows = by_day[d]
  running += day_rows.size
  promo = day_rows.count { |r| r[:promo].to_s.upcase.include?('15') }
  full  = day_rows.count { |r| r[:grand] && r[:grand] >= 90 && (r[:promo].nil? || !r[:promo].to_s.upcase.include?('15')) }
  comp  = day_rows.size - promo - full
  puts format('    %s  +%-2d  total=%-3d   [15FOR15:%d  full:%d  comp/other:%d]',
              d, day_rows.size, running, promo, full, comp)
end
