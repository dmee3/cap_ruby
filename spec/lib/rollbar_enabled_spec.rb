# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Rollbar enablement' do
  def enabled_after_configuring(env:, staging:)
    allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new(env))
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('STAGING').and_return(staging)

    # The gem's default; the initializer only ever switches it off.
    Rollbar.configuration.enabled = true
    load Rails.root.join('config/initializers/rollbar.rb')
    Rollbar.configuration.enabled
  end

  around do |example|
    original = Rollbar.configuration.enabled
    example.run
  ensure
    Rollbar.configuration.enabled = original
  end

  it 'reports from the real production deploy' do
    expect(enabled_after_configuring(env: 'production', staging: nil)).to be true
  end

  it 'stays out of the production project from staging' do
    expect(enabled_after_configuring(env: 'production', staging: 'true')).to be false
  end
end
