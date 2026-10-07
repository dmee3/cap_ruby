# frozen_string_literal: true
# typed: true

class PaymentScheduleService
  extend T::Sig

  class << self
    extend T::Sig

    # Every member season the user is on gets a schedule, populated from the
    # per-year default where one exists.
    #
    # Idempotent in two senses, both of which matter because the admin user form
    # calls this on every save: a season that already has a schedule is skipped
    # entirely, and a schedule that already has entries is never added to. A
    # double submit therefore cannot double anyone's dues.
    #
    # A season with no default for this member still gets its empty schedule —
    # the UI says so rather than pretending a schedule was built.
    sig { params(user: User).void }
    def ensure_payment_schedules_for_user(user)
      user.seasons_users.each do |su|
        next if su.removed?
        next if su.role != 'member' || user.payment_schedule_for(su.season_id).present?

        schedule = PaymentSchedule.create(user_id: user.id, season_id: su.season_id)
        populate_from_default(schedule, su.season)
      end
    end

    # Members whose payment schedule has no entries, or who have none at all —
    # missing from the burndown, and owing nothing on paper.
    sig { params(season_id: Integer).returns(T::Array[User]) }
    def blank_schedule_members(season_id)
      User.members_for_season(season_id).with_payments.reject do |member|
        member.payment_schedule_for(season_id)&.entries&.any?
      end
    end

    # Write the default's entries onto a schedule that has none. Returns the
    # number of entries created (0 when there is no default for this
    # year/ensemble/section/vet-status, or when the schedule is already
    # populated).
    sig { params(schedule: PaymentSchedule, season: Season).returns(Integer) }
    def populate_from_default(schedule, season)
      return 0 if schedule.entries.any?

      default = default_schedule_for(schedule.user, season.attributes)
      return 0 if default.nil?

      PaymentSchedule.transaction do
        default.each do |entry|
          schedule.entries.create!(pay_date: entry[:pay_date], amount: entry[:amount_cents])
        end
      end
      default.size
    end

    sig do
      params(
        user: User,
        season: T.any(Season, T::Hash[String, T.untyped])
      ).returns(T.nilable(T::Array[T::Hash[Symbol, T.untyped]]))
    end
    def default_schedule_for(user, season)
      # Seasons someone was removed from do not make them a vet, so a rookie who
      # leaves part-way through and returns is charged the rookie schedule.
      all_roles = user.seasons_users.reject(&:removed?)
      role = all_roles.select { |su| su.season_id == season['id'] }.first
      return nil unless role.present?

      vet = all_roles.any? { |su| su.season.year.to_i < role.season.year.to_i }

      default_entries_for(season_id: role.season_id, ensemble: role.ensemble, section: role.section, vet: vet)
    end

    # The default for one combination as `{ pay_date:, amount_cents: }` hashes
    # in date order, or nil when the season has none for it.
    sig do
      params(
        season_id: Integer,
        ensemble: T.nilable(String),
        section: T.nilable(String),
        vet: T::Boolean
      ).returns(T.nilable(T::Array[T::Hash[Symbol, T.untyped]]))
    end
    def default_entries_for(season_id:, ensemble:, section:, vet:)
      rows = DefaultScheduleEntry.where(
        season_id: season_id,
        ensemble: ensemble,
        section_group: DefaultScheduleEntry.section_group_for(section),
        vet_status: DefaultScheduleEntry.vet_status_for(vet)
      ).order(:pay_date)
      return nil if rows.empty?

      rows.map { |row| { pay_date: row.pay_date, amount_cents: row.amount_cents } }
    end
  end
end
