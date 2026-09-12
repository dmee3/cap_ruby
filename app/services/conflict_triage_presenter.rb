# frozen_string_literal: true
# typed: true

# Groups conflicts by member for the coordinator/admin triage queue (Flow 5).
#
# Wraps ConflictPresenter rather than reimplementing its label rules, so a
# triage row and a member's own row read identically. Two rules differ
# deliberately, both documented in 02-design-system.md §4.19/§4.26:
#
#   * every triage row carries its reason (deciding requires it, where a
#     member's own list stays scannable), and
#   * decided rows carry an attribution subline built from the Activity rows
#     ActivityLogger.log_conflict already writes — no new columns.
class ConflictTriagePresenter
  extend T::Sig

  class << self
    extend T::Sig

    sig do
      params(
        conflicts: T::Enumerable[Conflict],
        season_id: Integer,
        viewer: T.nilable(User)
      ).returns(T::Array[T::Hash[Symbol, T.untyped]])
    end
    def groups_for(conflicts, season_id, viewer = nil)
      conflicts = conflicts.to_a
      attributions = attributions_for(conflicts, viewer)

      groups = conflicts.group_by(&:user).map do |user, user_conflicts|
        group_for(user, user_conflicts, season_id, attributions)
      end

      # Longest-waiting member first; members with nothing pending sink to the
      # bottom rather than jumping the queue on a stale approved conflict.
      groups.sort_by do |group|
        [group[:pending_count].positive? ? 0 : 1, group[:oldest_pending_submission] || Time.current]
      end
    end

    # The triage queue groups by the date the conflict falls on, soonest first —
    # a coordinator works through "what's coming up", not "whose is this".
    # Each row still names its member, since the group header no longer does.
    sig do
      params(
        conflicts: T::Enumerable[Conflict],
        season_id: Integer,
        viewer: T.nilable(User)
      ).returns(T::Array[T::Hash[Symbol, T.untyped]])
    end
    def date_groups_for(conflicts, season_id, viewer = nil)
      conflicts = conflicts.to_a
      attributions = attributions_for(conflicts, viewer)

      conflicts
        .group_by { |conflict| conflict.start_date.to_date }
        .sort_by { |date, _| date }
        .map { |date, day_conflicts| date_group(date, day_conflicts, season_id, attributions) }
    end

    private

    sig do
      params(
        date: Date,
        conflicts: T::Array[Conflict],
        season_id: Integer,
        attributions: T::Hash[Integer, String]
      ).returns(T::Hash[Symbol, T.untyped])
    end
    def date_group(date, conflicts, season_id, attributions)
      ordered = conflicts.sort_by(&:start_date)

      {
        date: date.iso8601,
        date_label: date_heading(date),
        pending_count: ordered.count { |conflict| conflict.status.name == 'Pending' },
        rows: rows_for(ordered, attributions).map.with_index do |row, index|
          conflict = T.must(ordered[index])
          row.merge(
            member: conflict.user.full_name,
            section: conflict.user.section_for(season_id),
            initials: initials_for(conflict.user)
          )
        end
      }
    end

    # "Today" / "Tomorrow" inside the week, then a weekday, then a bare date
    # beyond a fortnight — the same proximity rule ConflictPresenter uses for
    # the row labels, so a heading and its rows agree.
    sig { params(date: Date).returns(String) }
    def date_heading(date)
      days = (date - Date.current).to_i

      case days
      when 0 then 'Today'
      when 1 then 'Tomorrow'
      when 2..13 then date.strftime('%A, %-m/%-d')
      else date.strftime('%a %-m/%-d/%y')
      end
    end

    sig do
      params(
        user: User,
        conflicts: T::Array[Conflict],
        season_id: Integer,
        attributions: T::Hash[Integer, String]
      ).returns(T::Hash[Symbol, T.untyped])
    end
    def group_for(user, conflicts, season_id, attributions)
      pending = conflicts.select { |conflict| conflict.status.name == 'Pending' }

      {
        user_id: user.id,
        member: user.full_name,
        initials: initials_for(user),
        ensemble: user.ensemble_for(season_id),
        section: user.section_for(season_id),
        pending_count: pending.size,
        season_count: conflicts.size,
        oldest_pending_submission: pending.map(&:created_at).min,
        waiting_days: waiting_days(pending),
        rows: rows_for(conflicts, attributions)
      }
    end

    # ConflictPresenter gates `reason` to Denied + next-upcoming rows. Triage
    # needs it on every row, so it is re-attached here rather than loosening
    # the member-facing rule.
    sig do
      params(
        conflicts: T::Array[Conflict],
        attributions: T::Hash[Integer, String]
      ).returns(T::Array[T::Hash[Symbol, T.untyped]])
    end
    def rows_for(conflicts, attributions)
      ordered = conflicts.sort_by(&:start_date)
      by_id = ordered.index_by(&:id)

      ConflictPresenter.rows_for(ordered).map do |row|
        conflict = by_id.fetch(row[:id])
        row.merge(
          reason: conflict.reason.to_s,
          relative_subline: [row[:relative_subline], attributions[conflict.id]].compact.join(' · ')
        )
      end
    end

    # "you approved it 52 days ago" — read from the activity trail, with the
    # second person reserved for the viewer's own decisions.
    sig { params(conflicts: T::Array[Conflict], viewer: T.nilable(User)).returns(T::Hash[Integer, String]) }
    def attributions_for(conflicts, viewer)
      decided = conflicts.reject { |conflict| conflict.status.name == 'Pending' }
      return {} if decided.empty?

      activities = Activity
                   .where(activity_type: 'conflict', user_id: decided.map(&:user_id))
                   .order(:created_at)
                   .to_a

      decided.each_with_object({}) do |conflict, memo|
        activity = latest_activity_for(activities, conflict)
        next unless activity

        memo[conflict.id] = attribution_sentence(conflict, activity, viewer)
      end
    end

    sig do
      params(activities: T::Array[Activity], conflict: Conflict).returns(T.nilable(Activity))
    end
    def latest_activity_for(activities, conflict)
      status = conflict.status.name.downcase
      activities.select do |activity|
        activity.user_id == conflict.user_id && activity.description.to_s.end_with?("marked #{status}")
      end.max_by(&:created_at)
    end

    sig do
      params(conflict: Conflict, activity: Activity, viewer: T.nilable(User)).returns(String)
    end
    def attribution_sentence(conflict, activity, viewer)
      actor = viewer && activity.created_by_id == viewer.id ? 'you' : actor_name(activity)
      verb = conflict.status.name.downcase
      ago = ActionController::Base.helpers.time_ago_in_words(activity.created_at)
      "#{actor} #{verb} it #{ago} ago"
    end

    sig { params(activity: Activity).returns(String) }
    def actor_name(activity)
      User.find_by(id: activity.created_by_id)&.full_name || 'a coordinator'
    end

    sig { params(pending: T::Array[Conflict]).returns(T.nilable(Integer)) }
    def waiting_days(pending)
      oldest = pending.map(&:created_at).min
      return nil unless oldest

      (Date.current - oldest.to_date).to_i
    end

    sig { params(user: User).returns(String) }
    def initials_for(user)
      [user.first_name, user.last_name].compact.map { |part| part.to_s.first.to_s.upcase }.join
    end
  end
end
