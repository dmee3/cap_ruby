class AuditionsController < ApplicationController
  def index
  end

  def update
    data = AuditionsProcessor.run
    registrations = data[:registrations]
    packets = data[:packets]

    registrations.each do |type, instruments|
      if !GoogleWriter.write_registrations(type, instruments)
        render 'auditions/google_failure'
        return
      end
    end

    packets.each do |type, instruments|
      if !GoogleWriter.write_packets(type, instruments)
        render 'auditions/google_failure'
        return
      end
    end

    render 'auditions/success'
  rescue ApiErrors::TooManyRequests => e
    render 'auditions/rate_limited'
  end
end
