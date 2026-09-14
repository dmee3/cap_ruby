# frozen_string_literal: true

module Admin
  # View-model for /admin/users/new and /admin/users/:id/edit.
  #
  # It reads the in-memory User, not the database, so a failed save re-renders
  # with everything the admin typed still in place — including the season rows,
  # which are the expensive part to re-enter. The old form fetched itself from
  # the API after mount, so a validation failure always came back blank.
  class UserFormPresenter
    SECTIONS = %w[Snare Tenors Bass Cymbals Woods Metals Electronics Auxiliary Visual].freeze
    ENSEMBLES = %w[World CC2].freeze

    def self.call(user, current_season)
      new(user, current_season).call
    end

    def initialize(user, current_season)
      @user = user
      @current_season = current_season
    end

    def call
      {
        user: user_model,
        seasons: seasons,
        errors: @user.errors.map { |e| { field: e.attribute.to_s, message: e.full_message } },
        current_season_id: @current_season && @current_season['id'],
        sections: SECTIONS,
        ensembles: ENSEMBLES,
        roles: SeasonsUser::ROLES
      }
    end

    private

    def user_model
      {
        id: @user.id,
        first_name: @user.first_name,
        last_name: @user.last_name,
        username: @user.username,
        email: @user.email,
        phone: @user.phone,
        # Answers "did I already send this" on the edit screen. Null until
        # someone uses the reset action — the welcome email only links to the
        # reset form, it never calls send_reset_password_instructions.
        reset_sent_at: @user.reset_password_sent_at&.iso8601,
        seasons_users: season_rows
      }
    end

    # Rows come off the in-memory association so unsaved edits survive a failed
    # save. `marked_for_destruction?` rows are the seasons staged for removal.
    def season_rows
      @user.seasons_users.reject(&:marked_for_destruction?).map do |su|
        {
          id: su.id,
          season_id: su.season_id,
          role: su.role,
          ensemble: su.ensemble,
          section: su.section
        }
      end
    end

    # Newest first, matching the form's "one block per season, newest first".
    # Each carries whether the person counts as a vet *as of* that season, since
    # that is what picks the default schedule and it is derived, never stored.
    def seasons
      Season.order(year: :desc).map do |season|
        {
          id: season.id,
          year: season.year,
          current: @current_season && season.id == @current_season['id'],
          vet: vet_as_of(season)
        }
      end
    end

    # Any earlier season, of any role, makes someone a vet — the same rule
    # PaymentScheduleService uses to pick between the Vet and Rookie defaults.
    def vet_as_of(season)
      @user.seasons_users.any? do |su|
        su.season.present? && su.season.year.to_i < season.year.to_i
      end
    end
  end
end
