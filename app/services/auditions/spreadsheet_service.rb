# frozen_string_literal: true

module Auditions
  class SpreadsheetService
    class << self
      def update
        registrations, packets = OrderService.fetch_items
        PacketAndRegistrationWriterService.write_data(packets, registrations)

        profiles = create_profiles_from_registrations_and_packets(registrations, packets)
        RecruitmentSheetUpdaterService.update(profiles)
      end

      private

      def profile_from_registration(reg)
        profile = Auditions::Profile.new(
          first_name: reg.name.split[0],
          last_name: reg.name.split[1..-1].join,
          email: reg.email,
          city: reg.city,
          state: reg.state,
          instrument: reg.instrument
        )
        profile.add_registration(reg.type, reg.date)
        profile
      end

      def profile_from_packet(packet)
        Auditions::Profile.new(
          first_name: packet.name.split[0],
          last_name: packet.name.split[1..-1].join,
          email: packet.email,
          city: packet.city,
          state: packet.state,
          instrument: packet.instrument
        )
      end

      def find_existing_profile(packet, profiles)
        first_name = packet.name.split[0].strip
        last_name = packet.name.split[1..-1].join.strip
        email = packet.email.strip
        profiles.find do |pro|
          pro.first_name.strip == first_name && pro.last_name.strip == last_name && pro.email == email
        end
      end

      def create_profiles_from_registrations_and_packets(registrations, packets)
        registrations.map { |reg| profile_from_registration(reg) }.tap do |profiles|
          packets.each do |packet|
            existing_profile = find_existing_profile(packet, profiles)

            if existing_profile.blank?
              existing_profile = profile_from_packet(packet)
              profiles << existing_profile
            end

            existing_profile.add_packet(packet.type, packet.date)
          end
        end
      end
    end
  end
end
