# frozen_string_literal: true

class AuditionsProcessor
  class << self
    def run
      registrations, packets = OrderProcessor.run
      return false unless GoogleWriter.write_registrations(registrations)
      return false unless GoogleWriter.write_packets(packets, [])

      true
    end
  end
end
