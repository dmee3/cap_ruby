# frozen_string_literal: true

class AuditionsProcessor
  class << self
    def run
      registrations, packets = OrderProcessor.run
      GoogleWriter.write_registrations(registrations)
      GoogleWriter.write_packets(packets, [])
    end
  end
end
