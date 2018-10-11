# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

# Create Seasons
eighteen = Season.create(year: '2018')
nineteen = Season.create(year: '2019')

# Create Roles
admin_role = Role.find_by_name('admin') || Role.create(name: 'admin')
Role.create(name: 'staff') unless Role.find_by_name 'staff'
member_role = Role.find_by_name('member') || Role.create(name: 'member')
puts 'Roles created'

# Create Payment Types
PaymentType.create(name: 'Cash') unless PaymentType.find_by_name 'Cash'
PaymentType.create(name: 'Stripe') unless PaymentType.find_by_name 'Stripe'
PaymentType.create(name: 'Check') unless PaymentType.find_by_name 'Check'
PaymentType.create(name: 'Square - Pos') unless PaymentType.find_by_name 'Square - Pos'
PaymentType.create(name: 'Square - Cash App') unless PaymentType.find_by_name 'Square - Cash App'
PaymentType.create(name: 'Other') unless PaymentType.find_by_name 'Other'
PaymentType.create(name: 'Venmo') unless PaymentType.find_by_name 'Venmo'
puts 'Payment Types created'

# Create Conflict Statuses
ConflictStatus.create(name: 'Denied') unless ConflictStatus.find_by_name 'Denied'
ConflictStatus.create(name: 'Pending') unless ConflictStatus.find_by_name 'Pending'
ConflictStatus.create(name: 'Approved') unless ConflictStatus.find_by_name 'Approved'
puts 'Conflict Statuses created'

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

  me.seasons << eighteen
  me.seasons << nineteen

  me.role = admin_role
  if me.save!
    puts 'Root User created'
  else
    puts 'ERROR: Unable to create Root User'
  end
end

# Create Test User (Alumni)
unless User.find_by_email ENV['TEST_ALUM_EMAIL']
  alum = User.create(
    first_name: ENV['TEST_ALUM_FIRST_NAME'],
    last_name: ENV['TEST_ALUM_LAST_NAME'],
    username: ENV['TEST_ALUM_USERNAME'],
    email: ENV['TEST_ALUM_EMAIL'],
    password: ENV['TEST_ALUM_PASSWORD'],
    password_confirmation: ENV['TEST_ALUM_PASSWORD']
  )

  alum.seasons << eighteen

  alum.role = member_role
  if alum.save!
    puts 'Test Alumni created'
  else
    puts 'ERROR: Unable to create Test Alumni'
  end
end

# Create Test User (Vet)
unless User.find_by_email ENV['TEST_VET_EMAIL']
  vet = User.create(
    first_name: ENV['TEST_VET_FIRST_NAME'],
    last_name: ENV['TEST_VET_LAST_NAME'],
    username: ENV['TEST_VET_USERNAME'],
    email: ENV['TEST_VET_EMAIL'],
    password: ENV['TEST_VET_PASSWORD'],
    password_confirmation: ENV['TEST_VET_PASSWORD']
  )

  vet.seasons << eighteen
  vet.seasons << nineteen

  vet.role = member_role
  if vet.save!
    puts 'Test Vet created'
  else
    puts 'ERROR: Unable to create Test Vet'
  end
end

# Create Test User (Rookie)
unless User.find_by_email ENV['TEST_ROOKIE_EMAIL']
  rookie = User.create(
    first_name: ENV['TEST_ROOKIE_FIRST_NAME'],
    last_name: ENV['TEST_ROOKIE_LAST_NAME'],
    username: ENV['TEST_ROOKIE_USERNAME'],
    email: ENV['TEST_ROOKIE_EMAIL'],
    password: ENV['TEST_ROOKIE_PASSWORD'],
    password_confirmation: ENV['TEST_ROOKIE_PASSWORD']
  )

  rookie.seasons << nineteen

  rookie.role = member_role
  if rookie.save!
    puts 'Test Rookie created'
  else
    puts 'ERROR: Unable to create Test Rookie'
  end
end

# Create Payment Schedule
unless PaymentSchedule.first
  eighteen_schedule = PaymentSchedule.new(season: eighteen)
  eighteen_entries = [
    [30000, Date.parse('2017-10-15')],
    [23000, Date.parse('2017-11-19')],
    [23000, Date.parse('2017-12-17')],
    [23000, Date.parse('2018-01-14')],
    [23000, Date.parse('2018-02-11')],
    [23000, Date.parse('2018-03-11')]
  ]
  eighteen_entries.each do |entry_info|
    entry = PaymentScheduleEntry.create(amount: entry_info[0], pay_date: entry_info[1])
    eighteen_schedule.payment_schedule_entries << entry
  end

  nineteen_schedule = PaymentSchedule.new(season: nineteen)
  nineteen_entries = [
    [30000, Date.parse('2017-10-21')],
    [23000, Date.parse('2017-11-18')],
    [23000, Date.parse('2017-12-16')],
    [23000, Date.parse('2018-01-13')],
    [23000, Date.parse('2018-02-10')],
    [23000, Date.parse('2018-03-10')]
  ]
  nineteen_entries.each do |entry_info|
    entry = PaymentScheduleEntry.create(amount: entry_info[0], pay_date: entry_info[1])
    nineteen_schedule.payment_schedule_entries << entry
  end

  alum.payment_schedules << eighteen_schedule
  vet.payment_schedules << eighteen_schedule
  vet.payment_schedules << nineteen_schedule
  rookie.payment_schedules << nineteen_schedule

  if eighteen_schedule.save! && nineteen_schedule.save!
    puts 'Payment Schedules created'
  else
    puts 'ERROR: Unable to create Payment Schedules'
  end
end
