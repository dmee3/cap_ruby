source 'https://rubygems.org'

ruby '2.7.2' # make sure to update the .ruby-version file as well

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end

# Rails gems
gem 'rails', '~> 6'
gem 'puma', '~> 5.0.4'
gem 'uglifier', '>= 1.3.0'
gem 'turbolinks', '~> 5'
gem 'bootsnap', require: false # Reduces boot times through caching; required in config/boot.rb
gem 'webpacker', '~> 4.x'

# App-specific gems
gem 'rollbar', '~> 3.1.0'
gem 'bcrypt', '~> 3.1.7'
gem 'paranoia', '~> 2.4.2'
gem 'jwt'
gem 'stripe', git: 'https://github.com/stripe/stripe-ruby'
gem 'mailgun-ruby', '~>1.1.6'
gem 'sidekiq'

# UI gems
gem 'bootstrap' # Can this be removed???
gem 'sassc-rails'
gem 'select2-rails'

# Auditions Processor gems
gem 'faraday'
gem 'google-api-client'

group :production do
  gem 'scout_apm', '~> 2.6.10'
  gem 'rails_12factor'
  gem 'pg'

  # Bot gems
  gem 'slack-ruby-bot'
  gem 'celluloid-io'
end

group :development, :test do
  gem 'sqlite3'
  gem 'byebug'
  gem 'capybara', '~> 2.15', '< 4.0'
  gem 'dotenv-rails'
  gem 'rspec-rails'
  gem 'rubocop', require: false
  gem 'factory_bot_rails'
  gem 'simplecov'
  gem 'faker', '~> 1.9.6'
end

group :development do
  gem 'annotate'
  gem 'web-console', '>= 3.3.0'
  gem 'listen', '>= 3.0.5', '< 3.2'
  gem 'spring'
  gem 'spring-watcher-listen', '~> 2.0.0'
  gem 'rails_real_favicon'
end
