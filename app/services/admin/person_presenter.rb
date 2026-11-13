# frozen_string_literal: true

module Admin
  # The view-model behind `/admin/users/:id` for anyone who isn't a dues-paying
  # member in the season being viewed: staff, coordinators, admins, and people
  # with no row in that season. Member 360 is built around dues and conflicts,
  # which these people don't have.
  class PersonPresenter
    class << self
      # A removed row keeps Member 360 only when it was a member's: their dues
      # stop where they were but still need settling. Removal overwrites the
      # role, so the schedule is the only trace of what they were.
      def member360?(user, season_id)
        role = user.role_for(season_id)
        return true if role == 'member'

        role == SeasonsUser::REMOVED_ROLE && user.payment_schedule_for(season_id).present?
      end

      def call(user, season)
        season_id = season['id']
        role = user.role_for(season_id)

        {
          name: user.full_name,
          email: user.email,
          username: user.username,
          phone: user.try(:phone),
          season_label: season['year'],
          current_role: role&.titleize,
          seasons: season_rows(user, season_id),
          past_dues: past_dues(user)
        }
      end

      private

      def season_rows(user, current_season_id)
        user.seasons_users
            .sort_by { |su| -su.season.year.to_i }
            .map do |su|
              {
                year: su.season.year,
                role: su.role&.titleize,
                placement: [su.ensemble, su.section].compact_blank.join(' · ').presence,
                current: su.season_id == current_season_id
              }
            end
      end

      # Every season with a schedule, the current one included: someone who was
      # a member and is staff now can still owe from the year they marched.
      def past_dues(user)
        user.payment_schedules
            .sort_by { |schedule| -schedule.season.year.to_i }
            .map do |schedule|
              expected = schedule.payment_schedule_entries.sum(&:amount)
              paid = user.amount_paid_for(schedule.season_id)
              {
                year: schedule.season.year,
                paid: money(paid),
                expected: money(expected),
                settled: paid >= expected
              }
            end
      end

      def money(cents)
        ActiveSupport::NumberHelper.number_to_currency(cents / 100.0, precision: (cents % 100).zero? ? 0 : 2)
      end
    end
  end
end
