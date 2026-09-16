# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DeployEnv do
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
        # Any non-blank value means staging; treating "false" as real production
        # would re-open the hole.
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
    # The regression: the old ENV['STAGING'] == true compared a String to a
    # boolean, so it never matched.
    it 'is true for the string "true"' do
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
