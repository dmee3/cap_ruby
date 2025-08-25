# frozen_string_literal: true

module Auditions
  class OrderService
    def initialize
      @packets = []
      @registrations = []
    end

    def self.fetch_items
      new.fetch_items
    end

    def fetch_items
      Logger.info('Starting order fetch')

      # Fetch orders from API
      orders = fetch_orders_with_error_handling
      return orders if orders.failure?

      # Validate the orders data
      validation_result = DataValidator.validate_orders(orders.data)
      return validation_result if validation_result.failure?

      # Process each order
      orders.data.each.with_index do |order, index|
        process_order(order, index + 1)
      end

      Logger.info('Order processing completed', {
                    registrations: @registrations.size,
                    packets: @packets.size
                  })

      Result.success({ registrations: @registrations, packets: @packets })
    rescue StandardError => e
      Logger.error('Unexpected error during order fetch', e)
      Result.failure(["Unexpected error: #{e.message}"])
    end

    private

    def fetch_orders_with_error_handling
      Logger.debug('Fetching orders from Squarespace API')
      orders = External::SquarespaceApi.orders
      Result.success(orders)
    rescue External::ApiErrors::TooManyRequests => e
      Logger.error('Rate limited by Squarespace API', e)
      Result.failure(['Rate limited by Squarespace API. Please try again later.'])
    rescue Faraday::TimeoutError => e
      Logger.error('Timeout connecting to Squarespace API', e)
      Result.failure(['Connection timeout to Squarespace API'])
    rescue Faraday::ConnectionFailed => e
      Logger.error('Failed to connect to Squarespace API', e)
      Result.failure(['Failed to connect to Squarespace API.'])
    rescue JSON::ParserError => e
      Logger.error('Invalid JSON response from Squarespace API', e)
      Result.failure(['Received invalid response from Squarespace API. The service may be experiencing issues.'])
    rescue StandardError => e
      Logger.error('Unexpected error fetching orders', e)
      Result.failure(["Unexpected error connecting to Squarespace API: #{e.message}"])
    end

    def process_order(order, order_number)
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
          process_line_item(item, date, order['customerEmail'], order_number, item_index + 1)
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

    def process_line_item(item, date, email, order_number, item_number)
      product_name = item['productName']

      if registration?(product_name)
        add_registration(item, date, email, order_number, item_number)
      elsif packet?(product_name)
        add_packet(item, date, email, order_number, item_number)
      else
        Logger.debug('Skipping unknown product', {
                       order_number: order_number,
                       item_number: item_number,
                       product_name: product_name
                     })
      end
    end

    def packet?(product_name)
      Packet.product_names.include?(product_name)
    end

    def registration?(product_name)
      Registration.product_names.include?(product_name)
    end

    def add_packet(item, date, email, order_number = nil, item_number = nil)
      @packets << Packet.new(date: date, item: item, email: email)
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

    def add_registration(item, date, email, order_number = nil, item_number = nil)
      @registrations << Registration.new(date: date, item: item, email: email)
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
  end
end
