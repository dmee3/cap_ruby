# frozen_string_literal: true
# typed: true

# Taking someone off a season's roster, and putting them back.
#
# Removal is a state, not a deletion: the seasons_users row stays and its role
# becomes 'removed'. That keeps the season's record of the person intact, stops
# the app treating them as current, and — because every roster query already
# filters on role — takes them out of the counts without touching those queries.
#
# Deleting the row instead is what this replaces. It left the payment schedule
# behind with nobody attached to it, so the dashboard went on expecting dues that
# no member owed, and anyone whose only season was deleted silently lost the
# ability to log in.
class SeasonRemovalService
  extend T::Sig

  class << self
    extend T::Sig

    # Dues stop where they stopped. The schedule is rewritten to total exactly
    # what the member has already paid, so they are square: not owed, not owing.
    # Admins can still edit the schedule afterwards for the rarer case where a
    # balance really is still due.
    # Returns the membership row, or nil when there was nothing to remove.
    sig { params(user: User, season_id: Integer, actor: T.nilable(User)).returns(T.nilable(SeasonsUser)) }
    def remove(user, season_id, actor: nil)
      row = user.seasons_users.find { |su| su.season_id == season_id }
      return nil if row.nil? || row.removed?

      SeasonsUser.transaction do
        row.update!(role: SeasonsUser::REMOVED_ROLE)
        truncate_schedule_to_paid(user, season_id)
      end

      log(user, season_id, actor, 'removed from')
      row
    end

    # Restoring the membership only. The schedule stays as removal left it —
    # rebuilt by hand, because there is no honest way to guess what someone
    # returning mid-season now owes. The UI says so before this is called.
    # Returns the membership row, or nil when it was not a removed one.
    sig do
      params(user: User, season_id: Integer, role: String, actor: T.nilable(User))
        .returns(T.nilable(SeasonsUser))
    end
    def restore(user, season_id, role: 'member', actor: nil)
      row = user.seasons_users.find { |su| su.season_id == season_id }
      return nil if row.nil? || !row.removed?

      row.update!(role: role)
      log(user, season_id, actor, 'restored to')
      row
    end

    private

    # Keep entries in date order until the money runs out: the ones already
    # covered stay whole, the one the payments landed mid-way through is cut down
    # to the remainder, and everything after it goes. A member who paid nothing
    # is left with an empty schedule rather than a zero-amount one, which is what
    # the blank-schedule alert and the burndown both already understand.
    sig { params(user: User, season_id: Integer).void }
    def truncate_schedule_to_paid(user, season_id)
      schedule = user.payment_schedule_for(season_id)
      return if schedule.nil?

      remaining = user.amount_paid_for(season_id)
      schedule.entries.sort_by(&:pay_date).each do |entry|
        if remaining <= 0
          entry.destroy!
        elsif entry.amount > remaining
          entry.update!(amount: remaining)
          remaining = 0
        else
          remaining -= entry.amount
        end
      end
    end

    sig { params(user: User, season_id: Integer, actor: T.nilable(User), verb: String).void }
    def log(user, season_id, actor, verb)
      return if actor.nil?

      year = Season.find_by(id: season_id)&.year
      ActivityLogger.log_activity(
        user_id: user.id,
        description: "#{user.full_name} #{verb} the #{year} season",
        activity_date: Date.today,
        created_by_id: actor.id,
        activity_type: 'season_membership'
      )
    end
  end
end
