# frozen_string_literal: true

# Single source of truth for "is this the real production deploy?".
#
# Staging runs RAILS_ENV=production with STAGING set, so Rails.env.production?
# is true there and can't gate anything that must only happen for real members.
#
# Plain Ruby so initializers can require_relative it before autoloading.
module DeployEnv
  class << self
    def real_production?
      Rails.env.production? && !staging?
    end

    # Truthiness, not == true: STAGING arrives as a String.
    def staging?
      ENV['STAGING'].present?
    end
  end
end
