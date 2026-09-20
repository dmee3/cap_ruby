# frozen_string_literal: true

module Admin
  # View-model for the §4.34 destructive confirm at the foot of
  # /admin/users/:id/edit.
  #
  # The confirm's whole job is to be specific: it names what goes and what
  # stays, with counts, so the admin is agreeing to something they can see
  # rather than to the word "delete". Everything here is counted `with_deleted`
  # where the record is paranoid, because a schedule entry that was already
  # soft-deleted still comes back with the user and would otherwise go
  # unmentioned.
  class UserDeletePresenter
    def self.call(user, current_season)
      new(user, current_season).call
    end

    def initialize(user, current_season)
      @user = user
      @current_season = current_season
    end

    def call
      {
        id: @user.id,
        # The typed-name gate compares against this. Full name rather than
        # username: it is what the rest of the confirm calls them, and asking
        # someone to type a string the screen doesn't show is a puzzle, not a
        # safeguard.
        full_name: @user.full_name,
        first_name: @user.first_name,
        deleted: @user.deleted_at.present?,
        deleted_at: @user.deleted_at&.iso8601,
        roster_line: roster_line,
        removed: removed_items,
        stays: stays_items
      }
    end

    private

    # What the delete takes away. Only non-zero rows: a list that says "0
    # payments" invites reading past it.
    def removed_items
      [
        'Their sign-in, so they can no longer log in',
        roster_item,
        schedule_item,
        payments_item,
        conflicts_item
      ].compact
    end

    # What survives the delete, which is the part an admin can't verify by
    # looking. Every one of these is a soft delete an admin can undo, so the
    # list ends by saying so.
    def stays_items
      [
        'Everything above is recoverable — nothing is erased from the database',
        fundraiser_item,
        'Activity log entries naming them, so the season keeps its history'
      ].compact
    end

    # The canvas copy assumed "from this season's roster". The people most
    # likely to be deleted are exactly the ones on no roster at all, and someone
    # can also sit on a season with role 'removed', so all three cases get a
    # sentence rather than one that is wrong two-thirds of the time.
    def roster_line
      return 'They are not on any season roster.' if active_rows.empty?

      years = active_rows.filter_map { |su| su.season&.year }.sort.reverse
      "On the #{years.join(', ')} #{'roster'.pluralize(years.length)}."
    end

    def roster_item
      return nil if active_rows.empty?

      "Their place on #{active_rows.length} season #{'roster'.pluralize(active_rows.length)}"
    end

    def schedule_item
      count = schedules.length
      return nil if count.zero?

      entries = PaymentScheduleEntry.with_deleted.where(payment_schedule_id: schedules.map(&:id)).count
      "#{count} payment #{'schedule'.pluralize(count)} (#{entries} scheduled #{'payment'.pluralize(entries)})"
    end

    def payments_item
      count = @user.payments.with_deleted.count
      return nil if count.zero?

      "#{count} recorded #{'payment'.pluralize(count)}"
    end

    def conflicts_item
      count = @user.conflicts.with_deleted.count
      return nil if count.zero?

      "#{count} submitted #{'conflict'.pluralize(count)}"
    end

    # Donations belong to the donor, not the performer: they are money the
    # organization has already taken, so they are untouched by a delete and the
    # confirm says so rather than leaving the admin to wonder.
    def fundraiser_item
      count = Calendar::Donation.joins(:fundraiser)
                                .where(calendar_fundraisers: { user_id: @user.id }).count
      return nil if count.zero?

      "#{count} calendar #{'donation'.pluralize(count)} from their fundraiser"
    end

    def active_rows
      @active_rows ||= @user.seasons_users.reject(&:removed?)
    end

    def schedules
      @schedules ||= PaymentSchedule.with_deleted.where(user_id: @user.id).to_a
    end
  end
end
