# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

admin = Role.find_by_name('admin') || Role.create(name: 'admin')
Role.create(name: 'staff') unless Role.find_by_name 'staff'
Role.create(name: 'member') unless Role.find_by_name 'member'

unless User.find_by_email ENV['ROOT_USER_EMAIL']
  me = User.new first_name: ENV['ROOT_USER_FIRST_NAME'],
                last_name: ENV['ROOT_USER_LAST_NAME'],
                email: ENV['ROOT_USER_EMAIL'],
                password: ENV['ROOT_USER_PASSWORD'],
                password_confirmation: ENV['ROOT_USER_PASSWORD']

  me.role = admin
  me.save
end
