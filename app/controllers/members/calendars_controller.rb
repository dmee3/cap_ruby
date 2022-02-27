# frozen_string_literal: true

module Members
  class CalendarsController < MembersController
    def index
      @donations = Calendar::Donation.where(user_id: current_user, season_id: Season.last.id)
      @total = @donations.sum(&:donation_date)

      @images = []
      (1..14).each { |i| @images << "cc2_#{i}_thumb.jpg" }
      (1..11).each { |i| @images << "world_#{i}_thumb.jpg" }
    end

    def download
      img = Calendar::ImageService.generate_image(current_user.id, params[:base_img])
      send_data img.to_datastream, type: 'image/png', disposition: 'inline'
    end
  end
end
