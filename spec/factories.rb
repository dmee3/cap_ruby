# rubocop:disable Metrics/BlockLength
FactoryBot.define do
  factory :inventory_category, class: 'Inventory::Category' do
    name { "Mallets" }
  end

  factory :season do
    year { Date.today.year }
  end

  factory :activity do
    activity_date { Date.today - rand(1..60).days }
    activity_type { Faker::Beer.brand }
    description { Faker::TvShows::NewGirl.quote }
    user
  end

  factory :payment_schedule_entry do
    amount { rand(10000..50000) }
    pay_date { Date.today + rand(-60..60).days }
    payment_schedule
  end

  factory :payment_schedule do
    season
    user
  end

  factory :payment_type do
    name { 'Cash' }
  end

  factory :payment do
    amount { rand(10000..50000) }
    date_paid { Date.today - rand(1..60).days }
    notes { Faker::TvShows::HowIMetYourMother.quote }
    payment_type
    season
    user
  end

  factory :conflict_status do
    name { 'Pending' }
  end

  factory :conflict do
    end_date { DateTime.now + 1.day }
    reason { Faker::TvShows::VentureBros.quote }
    season
    start_date { DateTime.now }
    conflict_status
    user
  end

  factory :role do
    name { 'member' }
  end

  factory :user do
    sequence(:email) { |n| "#{Faker::Internet.email}#{n}" }
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    password { Faker::Internet.password }
    role
    sequence(:username) { |n| "#{Faker::Internet.user_name}#{n}" }
  end
end
# rubocop:enable Metrics/BlockLength
