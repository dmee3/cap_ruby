# frozen_string_literal: true
# typed: true

# Taking someone off a season's roster, and putting them back.
#
# Removal is a state, not a deletion: the seasons_users row stays and its role
# becomes 'removed'. Deleting it strands the payment schedule, which then owes
# dues on behalf of nobody, and drops the person's last season out from under
# active_for_authentication?.
class SeasonRemovalService
  extend T::Sig

  class << self
    extend T::Sig

    # Dues stop where they stopped: the schedule is rewritten to total what has
    # already been paid. Admins edit it afterwards for the rarer case where a
    # balance really is still owed.
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

    # The membership only. The schedule stays as removal left it: there is no
    # honest way to guess what someone returning mid-season now owes, so it is
    # rebuilt by hand and the form says so before this is called.
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

    # Paying nothing leaves an empty schedule rather than a zero-amount entry:
    # that is the shape the blank-schedule alert and the burndown already read.
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
