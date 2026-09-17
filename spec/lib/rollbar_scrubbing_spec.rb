# frozen_string_literal: true

require 'rails_helper'

# Rollbar attaches request params to every report it sends. The whistleblower
# form posts the body of a concern someone may have written anonymously, so the
# one thing that must never leave the app is a param on an ordinary POST.
RSpec.describe 'Rollbar scrubbing' do
  it 'scrubs the whistleblower report body' do
    expect(Rollbar.configuration.scrub_fields).to include(:report)
  end

  it 'scrubs the reporter address, via the Rails filter list' do
    expect(Rails.application.config.filter_parameters).to include(:email)
  end

  it 'redacts the report out of params on their way into a payload' do
    scrubbed = Rollbar::Scrubbers::Params.call(
      params: { 'report' => 'someone hurt me', 'recipients' => %w[1 2 3] },
      config: Rollbar.configuration.scrub_fields
    )

    expect(scrubbed['report']).not_to include('someone hurt me')
    expect(scrubbed['recipients']).to eq(%w[1 2 3])
  end
end
