# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

# Create Roles
admin = Role.find_by_name('admin') || Role.create(name: 'admin')
Role.create(name: 'staff') unless Role.find_by_name 'staff'
Role.create(name: 'member') unless Role.find_by_name 'member'

# Create Payment Types
PaymentType.create(name: 'cash') unless PaymentType.find_by_name 'cash'
PaymentType.create(name: 'stripe') unless PaymentType.find_by_name 'stripe'
PaymentType.create(name: 'check') unless PaymentType.find_by_name 'check'
PaymentType.create(name: 'square - pos') unless PaymentType.find_by_name 'square - pos'
PaymentType.create(name: 'square - app') unless PaymentType.find_by_name 'square - app'

# Create Conflict Statuses
ConflictStatus.create(name: 'denied') unless ConflictStatus.find_by_name 'denied'
ConflictStatus.create(name: 'pending') unless ConflictStatus.find_by_name 'pending'
ConflictStatus.create(name: 'approved') unless ConflictStatus.find_by_name 'approved'

# Create Me
unless User.find_by_email ENV['ROOT_USER_EMAIL']
  me = User.new first_name: ENV['ROOT_USER_FIRST_NAME'],
                last_name: ENV['ROOT_USER_LAST_NAME'],
                email: ENV['ROOT_USER_EMAIL'],
                password: ENV['ROOT_USER_PASSWORD'],
                password_confirmation: ENV['ROOT_USER_PASSWORD']

  me.role = admin
  me.save
end
