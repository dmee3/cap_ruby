# frozen_string_literal: true

module AuditionCheckIn
  # One checked-in auditionee, with what their registration adds.
  class Person
    # The Registrations tab shows dates as M/D/YYYY. Date.parse would read
    # 5/1/2009 as the 5th of January, so only these exact shapes count.
    BIRTHDAY_FORMATS = ['%m/%d/%Y', '%Y-%m-%d'].freeze

    attr_reader :first_name, :last_name, :email, :selfie, :pronouns, :birthday

    def initialize(first_name:, last_name:, email:, selfie:, pronouns: nil, birthday: nil)
      @first_name = first_name
      @last_name = last_name
      @email = email
      @selfie = selfie
      @pronouns = pronouns
      @birthday = birthday
    end

    def full_name
      "#{first_name} #{last_name}".squish
    end

    def sort_key
      [first_name.to_s.downcase, last_name.to_s.downcase]
    end

    def age(on:)
      born = birth_date
      return nil unless born

      had_birthday = ([on.month, on.day] <=> [born.month, born.day]) >= 0
      years = on.year - born.year - (had_birthday ? 0 : 1)
      years if years.between?(0, 120)
    end

    # Google Forms writes an upload as https://drive.google.com/open?id=<file id>
    def selfie_file_id
      selfie.to_s[/[?&]id=([\w-]+)/, 1]
    end

    private

    def birth_date
      BIRTHDAY_FORMATS.each do |format|
        return Date.strptime(birthday.to_s.strip, format)
      rescue Date::Error
        next
      end
      nil
    end
  end
end
