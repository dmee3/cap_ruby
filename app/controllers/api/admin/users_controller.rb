# frozen_string_literal: true

module Api
  module Admin
    class UsersController < Api::AdminController
      def index
        @users = members
        render json: @users
      end

      def show
        @user = User.includes(:seasons_users).find(params[:id])
        render json: @user, include: [:seasons_users]
      end

      private

      def members
        User
          .members_for_season(current_season['id'])
          .map do |u|
            {
              id: u.id,
              full_name: u.full_name,
              email: u.email,
              section: u.section_for(current_season['id']),
              ensemble: u.ensemble_for(current_season['id'])
            }
          end
      end
    end
  end
end
