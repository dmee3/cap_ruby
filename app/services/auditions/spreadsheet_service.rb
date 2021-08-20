# frozen_string_literal: true

module Auditions
  class SpreadsheetService
    class << self
      def update
        registrations, packets = OrderService.fetch_items
        return false unless RegistrationWriterService.write_registrations(registrations)
        return false unless PacketWriterService.write_packets(packets, [])

        true
      end
    end
  end
end
