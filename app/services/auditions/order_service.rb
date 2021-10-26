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
        if order['orderNumber'] == '2067'
          add_kaylee(order)
        elsif order['orderNumber'] == '2045'
          add_kiersten(order)
        else
          date = DateTime.parse(order['createdOn'])
          order['lineItems'].map do |item|
            if registration?(item['productName'])
              add_registration(item, date)
            elsif packet?(item['productName'])
              add_packet(item, date)
            end
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
      if item['id'] == '61301752837128523e7e760a'
        add_kiersten(args)
      elsif item['id'] == '61328fff1bcded22f86716ba'
        add_kaylee(args)
      else
        item['customizations']&.each do |field|
          question = field['label']
          args[Registration::FIELD_TO_SYMBOL[question]] = field['value']
        end
        @registrations << Registration.new(args)
      end
    end

    def add_kiersten(order)
      args = { date: DateTime.parse(order['createdOn']) }
      args[:type] = 'CC22 Visual Ensemble Audition Registration'
      args[:name] = 'Kiersten Clinger'
      args[:email] = 'k2clinger@gmail.com'
      args[:city] = 'Xenia'
      args[:state] = 'Ohio'
      args[:instrument] = 'Visual Ensemble'
      @registrations << Registration.new(args)
    end

    def add_kaylee(order)
      args = { date: DateTime.parse(order['createdOn']) }
      args[:type] = 'CC22 Visual Ensemble Audition Registration'
      args[:name] = 'Kaylee Conner'
      args[:email] = 'knconner031200@gmail.com'
      args[:city] = 'Galloway'
      args[:state] = 'Ohio'
      args[:instrument] = 'Visual Ensemble'
      @registrations << Registration.new(args)
    end
  end
end
