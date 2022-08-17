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
      SquarespaceApi.orders.each do |order|
        date = DateTime.parse(order['createdOn'])
        order['lineItems'].map do |item|
          if registration?(item['productName'])
            add_registration(item, date)
          elsif packet?(item['productName'])
            add_packet(item, date)
          end
        end
      end
      [@registrations, @packets]
    end

    private

    def packet?(product_name)
      Packet::PRODUCT_NAMES.include?(product_name)
    end

    def registration?(product_name)
      Registration::PRODUCT_NAMES.include?(product_name)
    end

    def add_packet(item, date)
      args = { date: date, type: item['productName'] }
      item['customizations']&.each do |field|
        question = field['label']
        args[Packet::FIELD_TO_SYMBOL[question]] = field['value']
      end

      @packets << Packet.new(args)
    end

    def add_registration(item, date)
      args = { date: date, type: item['productName'] }
      item['customizations']&.each do |field|
        question = field['label']
        args[Registration::FIELD_TO_SYMBOL[question]] = field['value']
      end
      @registrations << Registration.new(args)
    end
  end
end
