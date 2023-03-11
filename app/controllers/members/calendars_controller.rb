# frozen_string_literal: true

module Members
  class CalendarsController < MembersController
    def index
      @completed_fundraisers = Calendar::Fundraiser.complete_for_user(current_user.id)
      @current_fundraiser = Calendar::Fundraiser.find_or_create_incomplete_for_user(current_user.id)
      @total = current_user.calendar_fundraisers.sum(&:total_donations)

      @images = (1..32).map { |x| ["calendar_#{x}_thumb.jpg"] }
    end

    def download
      img = Calendar::ImageService.generate_image(current_user.id, params[:base_img])
      CalendarMailer.with(user_name: current_user.full_name).download_email.deliver_later
      send_data img.to_datastream, type: 'image/png', disposition: 'inline'
    end
  end
end
