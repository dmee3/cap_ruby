# frozen_string_literal: true

module RequestHelpers
  # Sign in as a user with a specific role for the given season
  # Returns the user object
  def sign_in_as(role, season: nil)
    season ||= create(:season, year: Date.today.year)
    user = create(:user)
    create(:seasons_user, user: user, season: season, role: role.to_s)
    sign_in user

    # Set the season cookie so current_season works in controllers
    cookies[:cap_season_id] = season.id

    user
  end

  # Sign in as a member
  def sign_in_as_member(season: nil)
    sign_in_as(:member, season: season)
  end

  # Sign in as a staff member
  def sign_in_as_staff(season: nil)
    sign_in_as(:staff, season: season)
  end

  # Sign in as a coordinator
  def sign_in_as_coordinator(season: nil)
    sign_in_as(:coordinator, season: season)
  end

  # Sign in as an admin
  def sign_in_as_admin(season: nil)
    sign_in_as(:admin, season: season)
  end
end

RSpec.configure do |config|
  config.include Devise::Test::IntegrationHelpers, type: :request
  config.include RequestHelpers, type: :request
end
