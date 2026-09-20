# frozen_string_literal: true

module Api
  module Admin
    class UsersController < Api::AdminController
      def index
        render json: params[:roster] == 'none' ? off_all_rosters : roster
      end

      def show
        @user = User.includes(:seasons_users).find(params[:id])
        render json: @user, include: [:seasons_users]
      end

      private

      def roster
        season_id = current_season['id']
        User
          .for_season(season_id)
          .includes(:seasons_users, payment_schedules: :payment_schedule_entries)
          .map { |u| roster_row(u, season_id) }
      end

      def roster_row(user, season_id)
        schedule = user.payment_schedule_for(season_id)
        {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          section: user.section_for(season_id),
          ensemble: user.ensemble_for(season_id),
          role: user.role_for(season_id),
          vet: user.vet_in?(season_id),
          removed: user.seasons_users.any? { |su| su.season_id == season_id && su.removed? },
          # Seasons marched, the same count the Member 360 pill uses: removed
          # seasons are not part of someone's time with the group.
          season_count: user.seasons_users.count { |su| su.role == 'member' },
          # Drives the roster's "No schedule" pill and the health alert. A
          # schedule row with no entries counts as missing, because that is
          # exactly what it is to a member: no due dates and no total.
          has_schedule: schedule.present? && schedule.entries.any?
        }
      end

      # The one place the season scope is bypassed on purpose. These accounts
      # have no seasons_users rows at all, which means they are invisible on
      # every other screen. They also cannot sign in, though they are no longer
      # the only ones: someone removed from every season they had keeps their
      # rows and is equally locked out, and shows up on a roster rather than
      # here.
      def off_all_rosters
        User
          .where.not(id: SeasonsUser.select(:user_id))
          .includes(:payments)
          .order(:last_name, :first_name)
          .map do |user|
            {
              id: user.id,
              full_name: user.full_name,
              email: user.email,
              paid_all_time_cents: user.payments.sum(&:amount)
            }
          end
      end
    end
  end
end
