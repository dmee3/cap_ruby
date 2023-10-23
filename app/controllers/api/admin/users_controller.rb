# frozen_string_literal: true

module Api
  module Admin
    class UsersController < Api::AdminController
      def index
        if params[:behind]
          render json: behind_members
        else
          render json: members
        end
      end

      def show
        @user = User.includes(:seasons_users).find(params[:id])
        render json: @user, include: [:seasons_users]
      end

      private

      def members
        User
          .for_season(current_season['id'])
          .map do |u|
            {
              id: u.id,
              full_name: u.full_name,
              email: u.email,
              section: u.section_for(current_season['id']),
              ensemble: u.ensemble_for(current_season['id']),
              role: u.role_for(current_season['id'])
            }
          end
      end

      def behind_members
        s_id = current_season['id']
        behind_members = User.members_for_season(current_season['id']).with_payments.to_a.reject { |m| m.dues_status_okay?(s_id) }
        behind_members.map do |m|
          {
            id: m.id,
            name: m.full_name,
            behind: (m.payment_schedule_for(s_id).scheduled_to_date - m.amount_paid_for(s_id)),
            last_payment: m.payments_for(s_id).max_by(&:date_paid)
          }
        end
      end
    end
  end
end
