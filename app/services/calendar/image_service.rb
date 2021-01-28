module Calendar
  class ImageService
    class << self
      def generate(user_id)
        dates = Calendar::Donation.where(user_id: user_id).map(&:donation_date)
        base_image = ChunkyPNG::Image.from_file(base_image_path)
        logo_image = ChunkyPNG::Image.from_file(logo_image_path)
        dates.each { |date| base_image.compose!(logo_image, *DATE_COORDINATES[date - 1]) }
        fname = tmp_filename
        base_image.save(fname, :fast_rgba)
        fname
      end

      private

      def tmp_filename
        "tmp/#{SecureRandom.hex(4)}.png"
      end

      def base_image_path
        'public/images/calendar-base.png'
      end

      def logo_image_path
        'public/images/calendar-logo.png'
      end

      ROWS = [650, 735, 821, 906, 992]
      COLS = [145, 264, 383, 502, 621, 740, 859]

      DATE_COORDINATES = [
        [COLS[1], ROWS[0]],
        [COLS[2], ROWS[0]],
        [COLS[3], ROWS[0]],
        [COLS[4], ROWS[0]],
        [COLS[5], ROWS[0]],
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
        [COLS[3], ROWS[4]]
      ]
    end
  end
end