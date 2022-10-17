require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module CapRuby
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 6.0

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    config.time_zone = "Eastern Time (US & Canada)"
    config.eager_load_paths << Rails.root.join("lib")
    config.eager_load_paths << Rails.root.join("lib/auditions")
    config.eager_load_paths << Rails.root.join("lib/api")
    config.eager_load_paths << Rails.root.join("bot")

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
