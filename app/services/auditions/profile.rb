# frozen_string_literal: true

module Auditions
  class Profile
    attr_reader :first_name, :last_name, :email, :city, :state, :instrument, :packets,
                :registrations
    attr_accessor :packet, :registration

    def initialize(args)
      @first_name = args[:first_name]
      @last_name = args[:last_name]
      @email = args[:email]
      @city = args[:city]
      @state = args[:state]
      @instrument = args[:instrument]

      # Support both old and new architecture
      @packets = []
      @registrations = []

      # New architecture: direct references to objects
      @packet = args[:packet]
      @registration = args[:registration]

      # Additional registration fields
      @pronouns = args[:pronouns]
      @shoe_size = args[:shoe_size]
      @shirt_size = args[:shirt_size]
      @birthdate = args[:birthdate]
      @experience = args[:experience]
      @conflicts = args[:conflicts]
    end

    # Legacy methods for backward compatibility
    def add_packet(type, download_time)
      @packets << { type: type, downloaded: download_time }
    end

    def add_registration(type, purchase_time)
      @registrations << { type: type, purchased: purchase_time }
    end

    # Additional accessors for registration fields
    attr_reader :pronouns, :shoe_size, :shirt_size, :birthdate, :experience, :conflicts
  end
end
