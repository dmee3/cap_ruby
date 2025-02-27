# frozen_string_literal: true

module Members
  class CalendarsController < MembersController
    def index
      @all_calendars = Calendar::Fundraiser.for_user(current_user.id).for_season(current_season['id'])
      @completed = @all_calendars.select(&:completed?)
      @current = @all_calendars.reject(&:completed?).last ||
          Calendar::Fundraiser.create(user_id: current_user.id, season_id: current_season['id'])
      @total = @all_calendars.sum(&:total_donations)

      @images = (1..100).map { |x| ["calendar_#{x}_thumb.jpg"] }
    end

    def download
      img = Calendar::ImageService.generate_image(current_user.id, params[:base_img])
      send_data img.to_datastream, type: 'image/png', disposition: 'inline'
    end
  end
end
