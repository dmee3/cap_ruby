# frozen_string_literal: true

module Auditions
  class Profile
    attr_reader :first_name, :last_name, :email, :city, :state, :instrument, :packets, :registrations

    def initialize(args)
      @first_name = args[:first_name]
      @last_name = args[:last_name]
      @email = args[:email]
      @city = args[:city]
      @state = args[:state]
      @instrument = args[:instrument]
      @packets = []
      @registrations = []
    end

    def add_packet(type, download_time)
      @packets << { type: type, downloaded: download_time }
    end

    def add_registration(type, purchase_time)
      @registrations << { type: type, purchased: purchase_time }
    end
  end
end
