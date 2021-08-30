# frozen_string_literal: true

module Admin
  module Api
    class UsersController < ApiController
      def index
        @users = members
        render json: @users
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
              ensemble: u.ensemble_for(current_season['id']),
              payment_schedule_id: u.payment_schedule_for(current_season['id']).id
            }
          end
      end
    end
  end
end
