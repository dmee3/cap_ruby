# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserMailer do
  describe '#welcome_email' do
    let(:user) { create(:user, first_name: 'Iris', email: 'iris@example.com') }
    let(:mail) { described_class.with(user: user).welcome_email }
    let(:html) { mail.html_part.body.to_s }
    let(:text) { mail.text_part.body.to_s }

    it 'names the newest season they were added to' do
      create(:seasons_user, user: user, season: create(:season, year: '2026'))
      create(:seasons_user, user: user, season: create(:season, year: '2027'))

      expect(html).to include('for the 2027 season')
      expect(text).to include('for the 2027 season')
    end

    it 'ignores a season they were removed from' do
      create(:seasons_user, user: user, season: create(:season, year: '2026'))
      create(:seasons_user, user: user, season: create(:season, year: '2027'), role: SeasonsUser::REMOVED_ROLE)

      expect(text).to include('for the 2026 season')
    end

    # Staff and coordinators don't submit conflicts or pay dues, so the member
    # tour would describe a site they won't see.
    it 'only tells members what the site is for' do
      create(:seasons_user, user: user, role: 'staff')

      expect(text).not_to include('Track dues')
    end

    it 'sends members to choose a password via the reset form, in both parts' do
      create(:seasons_user, user: user, role: 'member')
      url = Rails.application.routes.url_helpers.new_user_password_url(host: 'www.example.com')

      expect(text).to include('Track dues')
      expect(html).to include(%(href="#{url}"))
      expect(text).to include(url)
    end
  end
end
