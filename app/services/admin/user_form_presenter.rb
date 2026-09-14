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
        initials: initials,
        # The header card's one-line summary: "@ghalloway · 4th season · Vet ·
        # World / Metals this year". Derived, not stored — season count and vet
        # status both come off the seasons_users rows.
        summary: summary_parts,
        seasons_users: season_rows
      }
    end

    def initials
      [@user.first_name, @user.last_name].compact.map { |n| n[0] }.join.upcase.presence
    end

    def summary_parts
      return [] if @user.id.nil?

      season_id = @current_season && @current_season['id']
      current_row = @user.seasons_users.find { |su| su.season_id == season_id }
      [
        @user.username && "@#{@user.username}",
        season_ordinal,
        vet_label(season_id),
        section_label(current_row)
      ].compact_blank
    end

    # Only members have an ensemble and section. A staff row can still carry
    # stale values from a season when they were a member, so key off the role
    # rather than on the columns being blank.
    def section_label(row)
      return nil if row.nil? || row.role != 'member'

      [row.ensemble, row.section].compact_blank.join(' / ').presence
    end

    def vet_label(season_id)
      return nil if season_id.nil?

      @user.vet_in?(season_id) ? 'Vet' : nil
    end

    # "4th season" — counts every season they're on, not just this one.
    def season_ordinal
      count = @user.seasons_users.size
      return nil if count.zero?

      "#{count}#{ordinal_suffix(count)} season"
    end

    def ordinal_suffix(num)
      return 'th' if (11..13).cover?(num % 100)

      { 1 => 'st', 2 => 'nd', 3 => 'rd' }.fetch(num % 10, 'th')
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
