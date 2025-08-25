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
      External::SquarespaceApi.orders.each do |order|
        date = DateTime.parse(order['createdOn'])
        order['lineItems'].map do |item|
          if registration?(item['productName'])
            add_registration(item, date, order['customerEmail'])
          elsif packet?(item['productName'])
            add_packet(item, date, order['customerEmail'])
          end
        end
      end
      [@registrations, @packets]
    end

    private

    def packet?(product_name)
      Packet.product_names.include?(product_name)
    end

    def registration?(product_name)
      Registration.product_names.include?(product_name)
    end

    def add_packet(item, date, email)
      @packets << Packet.new(date: date, item: item, email: email)
    end

    def add_registration(item, date, email)
      @registrations << Registration.new(date: date, item: item, email: email)
    end
  end
end
