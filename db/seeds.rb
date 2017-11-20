# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

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
  me = User.new first_name: ENV['ROOT_USER_FIRST_NAME'],
                last_name: ENV['ROOT_USER_LAST_NAME'],
                email: ENV['ROOT_USER_EMAIL'],
                password: ENV['ROOT_USER_PASSWORD'],
                password_confirmation: ENV['ROOT_USER_PASSWORD']

  me.role = admin_role
  if me.save!
    puts 'Root User created'
  else
    puts 'ERROR: Unable to create Root User'
  end
end

# Create Test User
unless User.find_by_email ENV['TEST_USER_EMAIL']
  garrett = User.create first_name: ENV['TEST_USER_FIRST_NAME'],
                        last_name: ENV['TEST_USER_LAST_NAME'],
                        email: ENV['TEST_USER_EMAIL'],
                        password: ENV['TEST_USER_PASSWORD'],
                        password_confirmation: ENV['TEST_USER_PASSWORD']

  garrett.role = member_role
  if garrett.save!
    puts 'Test User created'
  else
    puts 'ERROR: Unable to create Test User'
  end
end

# Create Payment Schedule
unless PaymentSchedule.first
  schedule = PaymentSchedule.new
  entries = [
    [30000, Date.parse('2017-10-15')],
    [23000, Date.parse('2017-11-19')],
    [23000, Date.parse('2017-12-17')],
    [23000, Date.parse('2018-01-14')],
    [23000, Date.parse('2018-02-11')],
    [23000, Date.parse('2018-03-11')]
  ]
  entries.each do |entry_info|
    entry = PaymentScheduleEntry.create(amount: entry_info[0], pay_date: entry_info[1])
    schedule.payment_schedule_entries << entry
  end

  garrett.payment_schedule = schedule

  if schedule.save!
    puts 'Test User Payment Schedule created'
  else
    puts 'ERROR: Unable to create Test User Payment Schedule'
  end
end
