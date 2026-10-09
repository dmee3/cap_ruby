# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MailerHelper do
  it "keeps the email palette in step with the app's light-theme tokens" do
    tokens = Rails.root.join('app/javascript/stylesheets/tokens.css').read

    described_class::EMAIL_COLORS.each do |name, hex|
      rgb = tokens[/--color-#{name}:\s*(\d+ \d+ \d+);/, 1]
      expect(rgb).to be_present, "no --color-#{name} token"
      expect(hex.delete('#').scan(/../).map { |h| h.to_i(16) }.join(' ')).to eq(rgb), "#{name} drifted"
    end
  end
end
