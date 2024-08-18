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
          first_name: reg.first_name,
          last_name: reg.last_name,
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
          first_name: packet.first_name,
          last_name: packet.last_name,
          email: packet.email,
          city: packet.city,
          state: packet.state,
          instrument: packet.instrument
        )
      end

      def find_existing_profile(packet, profiles)
        email = packet.email.strip
        profiles.find do |pro|
          packet.first_name.strip&.casecmp(pro.first_name.strip) == 0 &&
          packet.last_name.strip&.casecmp(pro.last_name.strip) == 0 &&
              email&.casecmp(pro.email) == 0
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
