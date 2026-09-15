# frozen_string_literal: true

# Single source of truth for "is this the real production deploy?".
#
# Staging runs with RAILS_ENV=production and STAGING set, so Rails.env.production?
# is TRUE on staging and cannot be used on its own to gate anything that must only
# happen for real members — live Stripe keys, or mail to real inboxes.
#
# Every such guard goes through .real_production? instead. It is deliberately
# plain Ruby with no Rails dependencies beyond Rails.env, so config/initializers
# can require_relative it at boot, before autoloading is available.
module DeployEnv
  class << self
    # True only on the production deploy that serves real members.
    def real_production?
      Rails.env.production? && !staging?
    end

    # True on the staging deploy: production Rails env, STAGING set.
    #
    # Truthiness, not == true: STAGING arrives from the environment as a String
    # ("1", "true"), so comparing it to the boolean true is always false. That
    # bug silently disabled PostOffice's "[STAGING - ignore]" subject prefix.
    # Matches how ApplicationController's Stripe key methods read it.
    def staging?
      ENV['STAGING'].present?
    end
  end
end
