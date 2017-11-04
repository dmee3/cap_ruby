require_relative 'boot'

require 'rails/all'
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"
# require "action_cable/engine"
require "sprockets/railtie"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

Dotenv::Railtie.load if Module.const_defined?('Dotenv')

module CapRuby
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.1

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.
    # config.autoload_paths << Rails.root.join('lib')

    # Eager load all files in the lib directory
    config.eager_load_paths << Rails.root.join('lib')

    # Don't generate system test files.
    config.generators.system_tests = nil

    # Render fields with error using .is-invalid class
    config.action_view.field_error_proc = proc do |html_tag, _instance|
      html_tag = html_tag.html_safe
      class_attr_index = html_tag.index 'class="'
      if class_attr_index
        html_tag.insert class_attr_index + 7, 'is-invalid '
      else
        html_tag.insert html_tag.index('>'), ' class="is-invalid"'
      end
    end
  end
end
