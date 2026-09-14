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
          season_count: user.seasons_users.size,
          # Drives the roster's "No schedule" pill and the health alert. A
          # schedule row with no entries counts as missing, because that is
          # exactly what it is to a member: no due dates and no total.
          has_schedule: schedule.present? && schedule.entries.any?
        }
      end

      # The one place the season scope is bypassed on purpose. These accounts
      # have no seasons_users rows at all, which means they are invisible on
      # every other screen AND cannot sign in — `active_for_authentication?`
      # requires seasons_users.any?.
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
