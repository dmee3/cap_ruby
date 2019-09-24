# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

TOTAL_MEMBERS = 60
SHOW_POSSIBILITIES = [
  Faker::TvShows::HowIMetYourMother,
  Faker::TvShows::FamilyGuy,
  Faker::TvShows::VentureBros,
  Faker::TvShows::BojackHorseman,
  Faker::TvShows::NewGirl,
  Faker::TvShows::GameOfThrones
]

SECTIONS = %w(Snare Tenors Bass Cymbals Woods Metals Auxiliary Electronics Visual)

# Create Seasons
seasons = {
  '2018' => {
    season: Season.find_or_create_by(year: '2018'),
    payment_schedule_entries: [
      [30000, Date.parse('2017-10-15')],
      [23000, Date.parse('2017-11-19')],
      [23000, Date.parse('2017-12-17')],
      [23000, Date.parse('2018-01-14')],
      [23000, Date.parse('2018-02-11')],
      [23000, Date.parse('2018-03-11')]
    ]
  },
  '2019' => {
    season: Season.find_or_create_by(year: '2019'),
    payment_schedule_entries: [
      [30000, Date.parse('2018-10-21')],
      [23000, Date.parse('2018-11-18')],
      [23000, Date.parse('2018-12-16')],
      [23000, Date.parse('2019-01-13')],
      [23000, Date.parse('2019-02-10')],
      [23000, Date.parse('2019-03-10')]
    ]
  },
  '2020' => {
    season: Season.find_or_create_by(year: '2020'),
    payment_schedule_entries: [
      [30000, Date.parse('2019-10-20')],
      [30000, Date.parse('2019-11-17')],
      [30000, Date.parse('2019-12-15')],
      [30000, Date.parse('2020-01-12')],
      [30000, Date.parse('2020-02-09')]
    ]
  }
}

# Create Roles
admin_role = Role.find_by_name('admin') || Role.create(name: 'admin')
member_role = Role.find_by_name('member') || Role.create(name: 'member')
puts "\e[035mRoles created\e[0m"

# Create Payment Types
PaymentType.create(name: 'Cash') unless PaymentType.find_by_name('Cash')
PaymentType.create(name: 'Stripe') unless PaymentType.find_by_name('Stripe')
PaymentType.create(name: 'Check') unless PaymentType.find_by_name('Check')
PaymentType.create(name: 'Square - Pos') unless PaymentType.find_by_name('Square - Pos')
PaymentType.create(name: 'Square - Cash App') unless PaymentType.find_by_name('Square - Cash App')
PaymentType.create(name: 'Other') unless PaymentType.find_by_name('Other')
PaymentType.create(name: 'Venmo') unless PaymentType.find_by_name('Venmo')
puts "\e[035mPayment Types created\e[0m"

# Create Conflict Statuses
denied_status = ConflictStatus.create(name: 'Denied') unless ConflictStatus.find_by_name('Denied')
pending_status = ConflictStatus.create(name: 'Pending') unless ConflictStatus.find_by_name('Pending')
approved_status = ConflictStatus.create(name: 'Approved') unless ConflictStatus.find_by_name('Approved')
resolved_status = ConflictStatus.create(name: 'Resolved') unless ConflictStatus.find_by_name('Resolved')
puts "\e[035mConflict Statuses created\e[0m"

STATUS_ARRAY = [
  denied_status,
  denied_status,
  pending_status,
  approved_status,
  approved_status,
  approved_status,
  resolved_status
]

# Create Me
unless User.find_by_email ENV['ROOT_USER_EMAIL']
  me = User.new(
    first_name: ENV['ROOT_USER_FIRST_NAME'],
    last_name: ENV['ROOT_USER_LAST_NAME'],
    username: ENV['ROOT_USER_USERNAME'],
    email: ENV['ROOT_USER_EMAIL'],
    password: ENV['ROOT_USER_PASSWORD'],
    password_confirmation: ENV['ROOT_USER_PASSWORD']
  )

  me.seasons << seasons['2018'][:season]
  me.seasons << seasons['2019'][:season]
  me.seasons << seasons['2020'][:season]
  me.role = admin_role

  if me.save!
    puts "\e[035mRoot User created\e[0m"
  else
    puts "\e[031mERROR: Unable to create Root User\e[0m"
  end
end

# Create all members
until User.all.count >= TOTAL_MEMBERS + 1

  # Create user
  name = ''
  until name.split(' ').length == 2
    name = SHOW_POSSIBILITIES.sample.character
  end

  first_name = name.split(' ').first
  last_name = name.split(' ').last
  username = "#{first_name[0]}#{last_name}"
  email = "#{username}@example.com"
  user = User.new(
    first_name: first_name,
    last_name: last_name,
    username: username,
    email: email,
    password: 'abc123',
    password_confirmation: 'abc123'
  )
  user.role = member_role

  next unless user.save

  puts "\e[034m#{first_name} #{last_name} created (#{User.all.count - 1} / #{TOTAL_MEMBERS})\e[0m"

  # Add seasons
  user.seasons << seasons['2018'][:season] if [true, false].sample
  user.seasons << seasons['2019'][:season] if [true, false].sample
  user.seasons << seasons['2020'][:season] if user.seasons.empty? || [true, false].sample

  # Add sections and payment schedules for each season
  seasons.each do |year, details|
    if user.seasons.map(&:year).include?(year)
      # Add payment schedule
      PaymentSchedule.new(season: details[:season]).tap do |sched|
        details[:payment_schedule_entries].each do |info|
          entry = PaymentScheduleEntry.create(amount: info[0], pay_date: info[1])
          sched.payment_schedule_entries << entry
        end
        user.payment_schedules << sched

        # Add section
        su = user.seasons_users.where(season: details[:season]).first
        su.section = SECTIONS.sample

        # Save everything
        su.save
        sched.save
        user.save
      end
    end
  end

  # Create conflicts
  3.times do
    next unless [true, true, false, false, false].sample
    season = user.seasons.sample
    status = STATUS_ARRAY.sample

    reason = SHOW_POSSIBILITIES.sample.quote

    schedule = user.payment_schedule_for(season.id).entries
    start_date = (schedule[0].pay_date..schedule[-1].pay_date).to_a.sample + (1..24).to_a.sample.hours
    end_date = start_date + (1..24).to_a.sample.hours
    Conflict.create(
      user_id: user.id,
      start_date: start_date,
      end_date: end_date,
      reason: reason,
      status_id: status.id,
      season_id: season.id
    )
    puts "\e[33m  Conflict created\e[0m"
  end

  # Create payments
  user.seasons.each do |season|
    schedule = user.payment_schedule_for(season.id)
    possibilities = schedule.entries.select { |s| s.pay_date < Date.today }

    possibilities.each do |p|
      next unless [true, true, true, true, true, true, true, true, true, false].sample

      if [true, true, true, true, true, false].sample
        note = SHOW_POSSIBILITIES.sample.quote
      end

      randomness = [-(p.amount - 2000), -15000, -10000, -5000, 0, 0, 0, 5000, 10000, 15000].sample

      Payment.create(
        user_id: user.id,
        payment_type_id: PaymentType.all.sample.id,
        amount: p.amount + randomness,
        date_paid: p.pay_date,
        notes: note,
        season_id: season.id
      )
      puts "  \e[32mPayment created\e[0m"
    end
  end
end
