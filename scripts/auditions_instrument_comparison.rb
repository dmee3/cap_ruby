# frozen_string_literal: true

# Audition registrations BY INSTRUMENT / SECTION over time, across the
# 2025, 2026, 2027 seasons.
#
# Instrument = the "Primary Instrument" field the registrant picked on the form.
# Grouped into sections for readability:
#   Snare, Tenors, Bass, Cymbals              -> Battery
#   Marimba, Vibraphone, Xylophone, Glock,
#     Aux Perc, Synth, Drum Kit, Bass Guitar  -> Front Ensemble
#   Visual Ensemble                           -> Visual
#
# Excludes $0 comp registrations (single-item orders that netted zero via a
# 100%-off code), same as the pace analysis.
#
# Aligned on days-before-first-audition:
#   2025: 2024-09-29   2026: 2025-09-28   2027: 2026-09-27
#
# Headline snapshot is taken at SNAP days out (see below).
#
# Run: bundle exec rails runner scripts/auditions_instrument_comparison.rb

require 'faraday'
require 'json'
require 'date'

ORDERS_URL = 'https://api.squarespace.com/1.0/commerce/orders'
API_KEY = ENV.fetch('SQUARESPACE_API_KEY')
HEADERS = { 'Authorization' => "Bearer #{API_KEY}", 'User-Agent' => 'ruby' }.freeze

SEASONS = {
  2025 => { audition: Date.new(2024, 9, 29), window: ['2024-07-01T00:00:00Z', '2024-11-15T00:00:00Z'],
            rx: /^CC25 (Music|Visual) Ensemble Audition Registration$/ },
  2026 => { audition: Date.new(2025, 9, 28), window: ['2025-07-01T00:00:00Z', '2025-11-15T00:00:00Z'],
            rx: /^CC26 (Music|Visual) Ensemble Audition Registration$/ },
  2027 => { audition: Date.new(2026, 9, 27), window: ['2026-07-01T00:00:00Z', '2026-11-15T00:00:00Z'],
            rx: /^CC27 (Music|Visual) Ensemble Audition Registration$/ }
}.freeze

SECTION = {
  'Snare' => 'Battery', 'Tenors' => 'Battery', 'Bass' => 'Battery', 'Cymbals' => 'Battery',
  'Marimba' => 'Front Ensemble', 'Vibraphone' => 'Front Ensemble', 'Xylophone' => 'Front Ensemble',
  'Glockenspiel' => 'Front Ensemble', 'Auxiliary Percussion' => 'Front Ensemble',
  'Synthesizer' => 'Front Ensemble', 'Drum Kit' => 'Front Ensemble', 'Bass Guitar' => 'Front Ensemble',
  'Visual Ensemble' => 'Visual'
}.freeze
SECTIONS = ['Battery', 'Front Ensemble', 'Visual'].freeze
INSTRUMENTS = ['Snare', 'Tenors', 'Bass', 'Cymbals', 'Marimba', 'Vibraphone', 'Xylophone',
               'Glockenspiel', 'Auxiliary Percussion', 'Synthesizer', 'Drum Kit', 'Bass Guitar',
               'Visual Ensemble'].freeze

def fetch_all_orders(start_date, end_date)
  orders = []
  params = { modifiedAfter: start_date, modifiedBefore: end_date }
  loop do
    resp = Faraday.get(ORDERS_URL, params, HEADERS)
    body = JSON.parse(resp.body)
    orders += body['result']
    break unless body.dig('pagination', 'hasNextPage')

    params = { cursor: body['pagination']['nextPageCursor'] }
  end
  orders
end

# registrations: { season => [ { days_before:, instrument:, section: } ] }
data = {}
excluded = Hash.new(0)
SEASONS.each do |year, cfg|
  regs = []
  fetch_all_orders(*cfg[:window]).each do |o|
    next if o['createdOn'].blank?

    date = DateTime.parse(o['createdOn']).new_offset('-04:00').to_date
    grand = o.dig('grandTotal', 'value')&.to_f
    one_item = Array(o['lineItems']).size == 1
    Array(o['lineItems']).each do |li|
      next unless li['productName'] =~ cfg[:rx]

      if one_item && grand&.zero?
        excluded[year] += 1
        next
      end

      inst = Array(li['customizations']).find { |c| c['label'] =~ /instrument/i }&.dig('value')
      inst = '(unspecified)' if inst.nil? || inst.strip.empty?
      regs << {
        days_before: (cfg[:audition] - date).to_i,
        instrument: inst,
        section: SECTION[inst] || 'Other'
      }
    end
  end
  data[year] = regs
end

pct = ->(n, d) { d.zero? ? '  -  ' : format('%4.1f%%', 100.0 * n / d) }

# ---------------------------------------------------------------------------
puts '=' * 74
puts "REGISTRATIONS BY SECTION  (paid only; $0 comps excluded: #{excluded.map { |k, v| "#{k}=#{v}" }.join(' ')})"
puts '=' * 74
printf("%-16s %-22s %-22s %-22s\n", '', '2025', '2026', '2027 (thru today)')
SECTIONS.each do |sec|
  cells = SEASONS.keys.map do |y|
    n = data[y].count { |r| r[:section] == sec }
    "#{n.to_s.rjust(3)}  (#{pct.call(n, data[y].size)})"
  end
  printf("%-16s %-22s %-22s %-22s\n", sec, *cells)
end
printf("%-16s %-22s %-22s %-22s\n", 'TOTAL',
       *SEASONS.keys.map { |y| data[y].size.to_s.rjust(3) })

# ---------------------------------------------------------------------------
puts
puts '=' * 74
puts 'REGISTRATIONS BY INSTRUMENT'
puts '=' * 74
printf("%-22s %8s %8s %8s\n", 'instrument', '2025', '2026', '2027')
INSTRUMENTS.each do |inst|
  counts = SEASONS.keys.map { |y| data[y].count { |r| r[:instrument] == inst } }
  next if counts.sum.zero?

  printf("%-22s %8d %8d %8d\n", inst, *counts)
end
# any unmapped
data.each_value do |regs|
  regs.map { |r| r[:instrument] }.uniq.each do |i|
    puts "  (!) unmapped instrument value: #{i.inspect}" unless INSTRUMENTS.include?(i) || i == '(unspecified)'
  end
end

# ---------------------------------------------------------------------------
# Pace by section: cumulative count at each days-before milestone.
MILESTONES = [40, 35, 30, 25, 20, 15, 10, 7, 3, 0].freeze

# Days-before-audition for the headline snapshot. 2027's data runs through
# today, so this must match today's distance from the 2027 audition date or the
# snapshot silently compares a partial season against two complete ones.
SNAP = 10
puts
puts '=' * 74
puts 'PACE BY SECTION — cumulative registrations at each days-before-audition mark'
puts '=' * 74
SECTIONS.each do |sec|
  puts "\n#{sec}"
  printf("  %-12s %10s %10s %10s\n", 'days out', '2025', '2026', '2027')
  MILESTONES.each do |d|
    cells = SEASONS.keys.map { |y| data[y].count { |r| r[:section] == sec && r[:days_before] >= d } }
    marker = d == SNAP ? ' <-' : ''
    printf("  %-12s %10d %10d %10d%s\n", "#{d}d", *cells, marker)
  end
end

# ---------------------------------------------------------------------------
# Section MIX over time within each season (how the composition shifts as
# the deadline approaches).
puts
puts '=' * 74
puts 'SECTION MIX AS THE DEADLINE APPROACHES  (share of registrations-to-date)'
puts '=' * 74
SEASONS.each_key do |year|
  puts "\n#{year} season"
  printf("  %-12s %14s %16s %10s   %s\n", 'by', 'Battery', 'Front Ens.', 'Visual', 'n')
  [40, 30, 20, 10, 0].each do |d|
    subset = data[year].select { |r| r[:days_before] >= d }
    n = subset.size
    b = subset.count { |r| r[:section] == 'Battery' }
    f = subset.count { |r| r[:section] == 'Front Ensemble' }
    v = subset.count { |r| r[:section] == 'Visual' }
    printf("  %-12s %6d %6s %8d %6s %5d %6s   %d\n",
           "#{d}d out", b, "(#{pct.call(b, n)})", f, "(#{pct.call(f, n)})", v, "(#{pct.call(v, n)})", n)
  end
end

# ---------------------------------------------------------------------------
# Snapshot: where each section stands at SNAP days out (today for 2027).
puts
puts '=' * 74
puts "SNAPSHOT — sections at #{SNAP} days before first audition"
puts '=' * 74
printf("%-16s %10s %10s %10s   %s\n", 'section', '2025', '2026', '2027', '2027 vs 2yr avg')
SECTIONS.each do |sec|
  at = SEASONS.keys.map { |y| data[y].count { |r| r[:section] == sec && r[:days_before] >= SNAP } }
  prior_avg = (at[0] + at[1]) / 2.0
  delta = prior_avg.zero? ? '-' : format('%+d%%', ((at[2] - prior_avg) / prior_avg * 100).round)
  printf("%-16s %10d %10d %10d   %s\n", sec, *at, delta)
end
