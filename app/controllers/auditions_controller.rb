class AuditionsController < ApplicationController
  def index
  end

  def update
    data = AuditionsProcessor.run
    music_list = data[:music]
    visual_list = data[:visual]
    packets = data[:packets]

    if !GoogleWriter.write_registrations('Music Registrations', music_list.by_instrument)
      render 'auditions/google_failure'
      return
    end

    if !GoogleWriter.write_registrations('Visual Registrations', visual_list.by_instrument)
      render 'auditions/google_failure'
      return
    end

    registered_emails = [music_list.emails, visual_list.emails].flatten

    packets.each do |type, instruments|
      if !GoogleWriter.write_packets(type, instruments, registered_emails)
        render 'auditions/google_failure'
        return
      end
    end

    render 'auditions/success'
  rescue ApiErrors::TooManyRequests => e
    render 'auditions/rate_limited'
  end
end
