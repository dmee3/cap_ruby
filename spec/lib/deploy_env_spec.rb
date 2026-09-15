# frozen_string_literal: true

require 'rails_helper'

# Every mail and Stripe safeguard in the app routes through these two
# predicates, so the staging case in particular is pinned explicitly: staging
# runs RAILS_ENV=production with STAGING set, and treating it as production is
# exactly the bug this module exists to prevent (cap_ruby-b3a.31).
RSpec.describe DeployEnv do
  # The env var is stubbed rather than read, so these never depend on whether
  # the machine running them happens to have a .env.
  def stub_env(staging:)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('STAGING').and_return(staging)
  end

  describe '.real_production?' do
    context 'on the real production deploy' do
      it 'is true' do
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
        stub_env(staging: nil)

        expect(described_class.real_production?).to be true
      end
    end

    context 'on staging (production Rails env with STAGING set)' do
      it 'is false' do
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
        stub_env(staging: 'true')

        expect(described_class.real_production?).to be false
      end

      it 'is false even when STAGING is the string "false"' do
        # Any non-blank value means "this is staging". A deploy that sets
        # STAGING=false to mean "not staging" would be surprising, and treating
        # it as real production would re-open the hole, so this pins the
        # conservative reading.
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
        stub_env(staging: 'false')

        expect(described_class.real_production?).to be false
      end
    end

    context 'in every other environment' do
      %w[development test].each do |env_name|
        it "is false in #{env_name}" do
          allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new(env_name))
          stub_env(staging: nil)

          expect(described_class.real_production?).to be false
        end
      end
    end
  end

  describe '.staging?' do
    it 'is true when STAGING holds any non-blank value' do
      stub_env(staging: 'true')
      expect(described_class.staging?).to be true
    end

    # This is the regression: the old check was ENV['STAGING'] == true, comparing
    # a String to a boolean, so it never matched and the "[STAGING - ignore]"
    # subject prefix had never fired once.
    it 'is true for the string "true", which the old == true check missed' do
      stub_env(staging: 'true')
      expect(described_class.staging?).to be true
    end

    it 'is true for "1"' do
      stub_env(staging: '1')
      expect(described_class.staging?).to be true
    end

    it 'is false when STAGING is unset' do
      stub_env(staging: nil)
      expect(described_class.staging?).to be false
    end

    it 'is false when STAGING is blank' do
      stub_env(staging: '')
      expect(described_class.staging?).to be false
    end
  end
end
