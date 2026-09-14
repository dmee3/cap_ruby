# frozen_string_literal: true

# 3-season audition registration PACE comparison (2025, 2026, 2027 seasons).
#
# Registration = "<CCxx> Music/Visual Ensemble Audition Registration" line items.
# EXCLUDED: any line item whose order netted $0 via a 100%-off comp code
#           (SWCSD*, day-of-cash, etc.) -- these are special cases, not real signups.
#
# Aligned on "days before each season's first audition" so the seasons overlay:
#   2025 season: first audition Sun 2024-09-29
#   2026 season: first audition Sun 2025-09-28
#   2027 season: first audition Sun 2026-09-27
#
# Sale context:
#   2025/2026: list price Music $115 / Visual $90; a 15%-off promo code ran most
#              of the window (15OFF / CC25MUSAUD / 15FOR15), tapering ~5 days out.
#   2027:      Music $100 / Visual $80 IS the current sale price; sale ENDS the day
#              after the data snapshot (prices rise the next day).
#
# Run: bundle exec rails runner scripts/auditions_3season_comparison.rb

require 'faraday'
require 'json'
require 'date'

ORDERS_URL = 'https://api.squarespace.com/1.0/commerce/orders'
API_KEY = ENV.fetch('SQUARESPACE_API_KEY')
HEADERS = { 'Authorization' => "Bearer #{API_KEY}", 'User-Agent' => 'ruby' }.freeze

SEASONS = {
  2025 => {
    audition_date: Date.new(2024, 9, 29),
    window: ['2024-07-01T00:00:00Z', '2024-11-15T00:00:00Z'],
    music: 'CC25 Music Ensemble Audition Registration',
    visual: 'CC25 Visual Ensemble Audition Registration',
    tz: '-04:00'
  },
  2026 => {
    audition_date: Date.new(2025, 9, 28),
    window: ['2025-07-01T00:00:00Z', '2025-11-15T00:00:00Z'],
    music: 'CC26 Music Ensemble Audition Registration',
    visual: 'CC26 Visual Ensemble Audition Registration',
    tz: '-04:00'
  },
  2027 => {
    audition_date: Date.new(2026, 9, 27),
    window: ['2026-07-01T00:00:00Z', '2026-11-15T00:00:00Z'],
    music: 'CC27 Music Ensemble Audition Registration',
    visual: 'CC27 Visual Ensemble Audition Registration',
    tz: '-04:00'
  }
}.freeze

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

# Per-season registrations, EXCLUDING $0 comp orders.
season_data = {}
excluded = Hash.new(0)
SEASONS.each do |year, cfg|
  orders = fetch_all_orders(*cfg[:window])
  regs = []
  orders.each do |o|
    next if o['createdOn'].blank?

    dt = DateTime.parse(o['createdOn']).new_offset(cfg[:tz])
    local_date = dt.to_date
    grand = o.dig('grandTotal', 'value')&.to_f
    promo = Array(o['discountLines']).map { |d| d['promoCode'] || d['name'] }.first

    Array(o['lineItems']).each do |li|
      kind = case li['productName']
             when cfg[:music] then :music
             when cfg[:visual] then :visual
             end
      next unless kind

      # Skip $0 comp registrations (single-item order that netted zero).
      one_item = Array(o['lineItems']).size == 1
      if one_item && grand && grand.zero?
        excluded[year] += 1
        next
      end

      (li['quantity'] || 1).to_i.times do
        regs << {
          datetime: dt,
          date: local_date,
          days_before: (cfg[:audition_date] - local_date).to_i,
          product: kind,
          promo: promo,
          unit: li.dig('unitPricePaid', 'value')&.to_f
        }
      end
    end
  end
  regs.sort_by! { |r| r[:datetime] }
  season_data[year] = regs
end

SNAP_DAYS_OUT = (SEASONS[2027][:audition_date] - (season_data[2027].map { |r| r[:date] }.max || Date.today)).to_i

puts '=' * 78
puts "PAID REGISTRATIONS ONLY (excluded $0 comp orders: #{excluded.map { |k, v| "#{k}=#{v}" }.join(', ')})"
puts '=' * 78
printf("%-8s %-8s %-8s %-8s %-14s %-14s\n", 'season', 'total', 'music', 'visual', 'first reg', 'last reg')
SEASONS.each_key do |year|
  r = season_data[year]
  printf("%-8s %-8d %-8d %-8d %-14s %-14s\n",
         year, r.size, r.count { |x| x[:product] == :music }, r.count { |x| x[:product] == :visual },
         r.first&.dig(:date), r.last&.dig(:date))
end

# ---------------------------------------------------------------------------
MILESTONES = [42, 40, 35, 30, 28, 25, 21, 20, 15, 14, 10, 7, 5, 3, 1, 0].freeze

def cum_table(season_data, milestones, filter = nil)
  printf("%-14s", 'days out')
  season_data.each_key { |y| printf("%-12s", "#{y}") }
  puts
  milestones.each do |d|
    printf("%-14s", "#{d}d")
    season_data.each_key do |year|
      c = season_data[year].count { |r| r[:days_before] >= d && (filter.nil? || r[:product] == filter) }
      printf("%-12s", c)
    end
    puts
  end
end

puts
puts '=' * 78
puts 'CUMULATIVE PAID REGISTRATIONS BY DAYS-BEFORE-FIRST-AUDITION'
puts '=' * 78
cum_table(season_data, MILESTONES)

puts
puts 'MUSIC ONLY'
cum_table(season_data, MILESTONES, :music)

# ---------------------------------------------------------------------------
puts
puts '=' * 78
puts "PACE AS % OF SEASON FINAL TOTAL  (2027 final still open)"
puts '=' * 78
finals = SEASONS.each_key.map { |y| [y, season_data[y].size] }.to_h
printf("%-14s", 'days out')
SEASONS.each_key { |y| printf("%-12s", "#{y}") }
puts
MILESTONES.each do |d|
  printf("%-14s", "#{d}d")
  SEASONS.each_key do |year|
    c = season_data[year].count { |r| r[:days_before] >= d }
    pct = finals[year].zero? ? 0 : (100.0 * c / finals[year])
    printf("%-12s", "#{pct.round(1)}%")
  end
  puts
end

# ---------------------------------------------------------------------------
puts
puts '=' * 78
puts 'NEW PAID REGISTRATIONS PER WEEK-BEFORE-AUDITION (wk 1 = final 7 days)'
puts '=' * 78
printf("%-18s", 'week')
SEASONS.each_key { |y| printf("%-12s", "#{y}") }
puts
(1..8).to_a.reverse.each do |w|
  hi = w * 7
  lo = (w - 1) * 7
  printf("%-18s", "wk #{w} (#{lo + 1}-#{hi}d)")
  SEASONS.each_key do |year|
    c = season_data[year].count { |r| r[:days_before] > lo && r[:days_before] <= hi }
    printf("%-12s", c)
  end
  puts
end
printf("%-18s", 'audition day+after')
SEASONS.each_key do |year|
  printf("%-12s", season_data[year].count { |r| r[:days_before] <= 0 })
end
puts

# ---------------------------------------------------------------------------
puts
puts '=' * 78
puts 'DISCOUNT / PROMO USAGE (paid registrations only)'
puts '=' * 78
SEASONS.each_key do |year|
  regs = season_data[year]
  puts "\n#{year} season (n=#{regs.size}):"
  regs.group_by { |r| r[:promo] || '(full price, no code)' }
      .sort_by { |_, v| -v.size }
      .each do |promo, rows|
    last = rows.map { |r| r[:date] }.max
    printf("  %-28s %3d  (%.0f%%)  last %s (%dd out)\n",
           promo, rows.size, 100.0 * rows.size / regs.size, last,
           (SEASONS[year][:audition_date] - last).to_i)
  end
end

# ---------------------------------------------------------------------------
puts
puts '=' * 78
puts "SNAPSHOT: 2027 vs prior seasons at #{SNAP_DAYS_OUT} days before first audition"
puts '=' * 78
snap_date_2027 = season_data[2027].map { |r| r[:date] }.max
puts "2027 data snapshot date: #{snap_date_2027}  (#{SNAP_DAYS_OUT}d before 2026-09-27)"
puts '15%-off sale is CURRENTLY RUNNING for 2027 and ends the following day.'
puts
SEASONS.each_key do |year|
  at = season_data[year].count { |r| r[:days_before] >= SNAP_DAYS_OUT }
  m = season_data[year].count { |r| r[:days_before] >= SNAP_DAYS_OUT && r[:product] == :music }
  final = season_data[year].size
  cur = year == 2027 ? '   <-- current (final TBD)' : "   final #{final}  (#{(100.0 * at / final).round}% of final in by now)"
  printf("  %d: %3d paid (%d M / %d V) at %dd out%s\n", year, at, m, at - m, SNAP_DAYS_OUT, cur)
end
