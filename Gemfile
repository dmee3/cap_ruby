source 'https://rubygems.org'

# Make sure to update the following, too:
# - .ruby-version
# - .tool-versions
# - .github/workflows/ruby.yml
ruby '3.1.2'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end

gem 'acts_as_paranoid'
gem 'bcrypt', '~> 3.1.7'
gem 'bootsnap', require: false # Reduces boot times through caching; required in config/boot.rb
gem 'chunky_png' # Calendar image processing
gem 'devise'
gem 'faraday' # Auditions Processor
gem 'google-api-client' # Auditions Processor
gem 'jbuilder'
gem 'jwt'
gem 'mailgun-ruby', '~>1.2.5'
gem 'puma', '< 7'
gem 'rails', '~> 7.2'
gem 'rollbar', '~> 3.6.0'
gem 'sass-rails', '>= 6'
gem 'select2-rails'
gem 'sidekiq'
gem 'sorbet-runtime', '~> 0.5'

gem 'stripe', git: 'https://github.com/stripe/stripe-ruby'
gem 'turbolinks', '~> 5'
gem 'vite_rails'

group :production do
  gem 'pg'
  gem 'rails_12factor'
  gem 'scout_apm'
end

group :development, :test do
  gem 'byebug'
  gem 'capybara', '~> 2.15', '< 4.0'
  gem 'dotenv-rails'
  gem 'factory_bot_rails'
  gem 'faker', '~> 3.5.1'
  gem 'rspec-rails'
  gem 'rubocop', require: false
  gem 'rubocop-rails'
  gem 'rubocop-rspec'
  gem 'sorbet', '~> 0.5', require: false
  gem 'sqlite3', '~> 2.1.0'
  gem 'tapioca', '~> 0.15', require: false
end

group :development do
  gem 'annotate'
  gem 'letter_opener'
  gem 'listen', '~> 3.3'
  gem 'spring'
  gem 'web-console', '>= 4.1.0'
end
