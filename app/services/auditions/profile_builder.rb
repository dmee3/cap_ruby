# frozen_string_literal: true

module Auditions
  class ProfileBuilder
    def initialize(packet_class: Packet, registration_class: Registration, validator: DataValidator)
      @packet_class = packet_class
      @registration_class = registration_class
      @validator = validator
    end

    def call(orders)
      Logger.step('Build profiles from orders') do
        build_profiles_from_orders(orders)
      end
    end

    private

    attr_reader :packet_class, :registration_class, :validator

    def build_profiles_from_orders(orders)
      packets = []
      registrations = []

      orders.each.with_index do |order, index|
        process_order(order, index + 1, packets, registrations)
      end

      # Create merged profiles
      profiles = create_profiles_from_data(registrations, packets)

      # Validate the generated profiles
      validation_result = validator.validate_profiles(profiles)
      return validation_result if validation_result.failure?

      Logger.info('Profiles built successfully', {
                    registrations: registrations.size,
                    packets: packets.size,
                    profiles: profiles.size
                  })

      Result.success({
                       registrations: registrations,
                       packets: packets,
                       profiles: profiles
                     })
    end

    def process_order(order, order_number, packets, registrations)
      Logger.debug('Processing order',
                   { order_number: order_number, email: order['customerEmail'] })

      begin
        if order['createdOn'].blank?
          Logger.warn('Missing created date in order', { order_number: order_number })
          return # Skip this order
        end

        date = DateTime.parse(order['createdOn'])

        if order['lineItems'].blank? || !order['lineItems'].is_a?(Array)
          Logger.warn('Missing or invalid line items in order', { order_number: order_number })
          return # Skip this order
        end

        order['lineItems'].each.with_index do |item, item_index|
          process_line_item(item, date, order['customerEmail'], order_number, item_index + 1,
                            packets, registrations)
        end
      rescue ArgumentError, TypeError => e
        Logger.warn('Invalid date format in order', {
                      order_number: order_number,
                      date: order['createdOn'],
                      error: e.message
                    })
        # Skip this order but continue processing others
      end
    end

    # rubocop:disable Metrics/ParameterLists
    def process_line_item(item, date, email, order_number, item_number, packets, registrations)
      product_name = item['productName']

      if registration?(product_name)
        add_registration(item, date, email, order_number, item_number, registrations)
      elsif packet?(product_name)
        add_packet(item, date, email, order_number, item_number, packets)
      else
        Logger.debug('Skipping unknown product', {
                       order_number: order_number,
                       item_number: item_number,
                       product_name: product_name
                     })
      end
    end
    # rubocop:enable Metrics/ParameterLists

    def packet?(product_name)
      packet_class.product_names.include?(product_name)
    end

    def registration?(product_name)
      registration_class.product_names.include?(product_name)
    end

    def add_packet(item, date, email, order_number, item_number, packets)
      packets << packet_class.new(date: date, item: item, email: email)
      Logger.debug('Added packet', {
                     order_number: order_number,
                     item_number: item_number,
                     product_name: item['productName'],
                     email: email
                   })
    rescue StandardError => e
      Logger.error('Failed to create packet', e, {
                     order_number: order_number,
                     item_number: item_number,
                     product_name: item['productName'],
                     email: email
                   })
      # Continue processing other items
    end

    def add_registration(item, date, email, order_number, item_number, registrations)
      registrations << registration_class.new(date: date, item: item, email: email)
      Logger.debug('Added registration', {
                     order_number: order_number,
                     item_number: item_number,
                     product_name: item['productName'],
                     email: email
                   })
    rescue StandardError => e
      Logger.error('Failed to create registration', e, {
                     order_number: order_number,
                     item_number: item_number,
                     product_name: item['productName'],
                     email: email
                   })
      # Continue processing other items
    end

    # rubocop:disable Metrics/MethodLength
    def create_profiles_from_data(registrations, packets)
      profiles = []

      # Create profiles from registrations
      registrations.each.with_index do |reg, index|
        Logger.debug('Creating profile from registration', { index: index + 1, email: reg.email })
        profiles << Profile.new(
          first_name: reg.first_name,
          last_name: reg.last_name,
          email: reg.email,
          city: reg.city,
          state: reg.state,
          pronouns: reg.pronouns,
          shoe_size: reg.shoe_size,
          shirt_size: reg.shirt_size,
          instrument: reg.instrument,
          birthdate: reg.birthdate,
          experience: reg.experience,
          conflicts: reg.conflicts,
          registration: reg
        )
      rescue StandardError => e
        Logger.error('Failed to create profile from registration', e, {
                       index: index + 1,
                       email: reg&.email
                     })
      end

      # Merge packets into existing profiles or create new ones
      packets.each.with_index do |packet, index|
        Logger.debug('Processing packet for profile merging',
                     { index: index + 1, email: packet.email })

        existing_profile = profiles.find { |p| p.email == packet.email }
        if existing_profile
          Logger.debug('Merging packet into existing profile', { email: packet.email })
          existing_profile.packet = packet
        else
          Logger.debug('Creating new profile from packet', { email: packet.email })
          profiles << Profile.new(
            first_name: packet.first_name,
            last_name: packet.last_name,
            email: packet.email,
            city: packet.city,
            state: packet.state,
            instrument: packet.instrument,
            packet: packet
          )
        end
      rescue StandardError => e
        Logger.error('Failed to process packet for profile', e, {
                       index: index + 1,
                       email: packet&.email
                     })
      end

      profiles
    end
    # rubocop:enable Metrics/MethodLength
  end
end
