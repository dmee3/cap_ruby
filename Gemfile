source 'https://rubygems.org'

ruby '2.4.1' # make sure to update the .ruby-version file as well

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end

gem 'rails', '~> 5.1.4'
gem 'puma', '~> 3.7'
gem 'uglifier', '>= 1.3.0'
gem 'turbolinks', '~> 5'
gem 'rollbar', '~> 2.15'
gem 'bcrypt', '~> 3.1.7'
gem 'paranoia', '~> 2.2'
gem 'jwt'
gem 'stripe', git: 'https://github.com/stripe/stripe-ruby'

# UI gems
gem 'bootstrap', '~> 4.1.2'
gem 'jquery-rails'
gem 'vuejs-rails'
gem 'sass-rails', '~> 5.0'
gem 'font-awesome-rails'
gem 'coffee-rails', '~> 4.2'
gem 'select2-rails'
gem 'momentjs-rails'
gem 'chart-js-rails'

# Bot
gem 'slack-ruby-bot'
gem 'celluloid-io'

group :production, :staging do
  gem 'rails_12factor'
  gem 'pg'
end

group :development, :test do
  gem 'sqlite3'
  gem 'byebug'
  gem 'capybara', '~> 2.13'
  gem 'dotenv-rails'
  gem 'rspec-rails', '~> 3.5'
  gem 'rubocop', require: false
  gem 'rspec-junklet', '~> 2.2'
  gem 'factory_bot_rails'
  gem 'simplecov'
  gem 'faker'
end

group :development do
  gem 'web-console', '>= 3.3.0'
  gem 'listen', '>= 3.0.5', '< 3.2'
  gem 'spring'
  gem 'spring-watcher-listen', '~> 2.0.0'
  gem 'rails_real_favicon'
end
