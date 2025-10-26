# frozen_string_literal: true

module Calendar
  class ImageService
    class << self
      ROWS = [403, 469, 535, 601, 667, 733].freeze
      COLS = [199, 303, 407, 511, 615, 719, 823].freeze

      DATE_COORDINATES = [
        [COLS[6], ROWS[0]],
        [COLS[0], ROWS[1]],
        [COLS[1], ROWS[1]],
        [COLS[2], ROWS[1]],
        [COLS[3], ROWS[1]],
        [COLS[4], ROWS[1]],
        [COLS[5], ROWS[1]],
        [COLS[6], ROWS[1]],
        [COLS[0], ROWS[2]],
        [COLS[1], ROWS[2]],
        [COLS[2], ROWS[2]],
        [COLS[3], ROWS[2]],
        [COLS[4], ROWS[2]],
        [COLS[5], ROWS[2]],
        [COLS[6], ROWS[2]],
        [COLS[0], ROWS[3]],
        [COLS[1], ROWS[3]],
        [COLS[2], ROWS[3]],
        [COLS[3], ROWS[3]],
        [COLS[4], ROWS[3]],
        [COLS[5], ROWS[3]],
        [COLS[6], ROWS[3]],
        [COLS[0], ROWS[4]],
        [COLS[1], ROWS[4]],
        [COLS[2], ROWS[4]],
        [COLS[3], ROWS[4]],
        [COLS[4], ROWS[4]],
        [COLS[5], ROWS[4]],
        [COLS[6], ROWS[4]],
        [COLS[0], ROWS[5]],
        [COLS[1], ROWS[5]]
      ].freeze

      def generate_image(user_id, base_img)
        dates = Calendar::Fundraiser.find_or_create_incomplete_for_user(user_id).donations.map(&:donation_date)
        ChunkyPNG::Image.from_file(base_image_path(base_img)).tap do |base_image|
          logo_image = ChunkyPNG::Image.from_file(logo_image_path)
          dates.each { |date| base_image.compose!(logo_image, *DATE_COORDINATES[date - 1]) }
        end
      end

      private

      def tmp_filename
        "tmp/#{SecureRandom.hex(4)}.png"
      end

      def base_image_path(base_img)
        "public/images/calendars/#{base_img}.png"
      end

      def logo_image_path
        'public/images/calendars/logo.png'
      end
    end
  end
end
