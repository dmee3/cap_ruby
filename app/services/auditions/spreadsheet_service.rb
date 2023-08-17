# frozen_string_literal: true

module Auditions
  class SpreadsheetService
    class << self
      def update
        update_packets_and_registrations
      end

      private

      def update_packets_and_registrations
        registrations, packets = OrderService.fetch_items
        return false unless PacketAndRegistrationWriterService.write_data(packets, registrations)

        profiles = create_profiles_from_registrations(registrations)
        profiles = create_or_update_profiles_from_packets(profiles, packets)
        return false unless RecruitmentSheetUpdaterService.update(packets, registrations, profiles)

        true
      end

      def create_profiles_from_registrations(registrations)
        registrations.map do |reg|
          profile = Auditions::Profile.new(
            first_name: reg.name.split[0],
            last_name: reg.name.split[1..-1].join,
            email: reg.email,
            city: reg.city,
            state: reg.state
          )
          profile.add_registration(reg.type, reg.date)
          profile
        end
      end

      def create_or_update_profiles_from_packets(profiles, packets)
        packets.each do |packet|
          first_name = packet.name.split[0]
          last_name = packet.name.split[1..-1].join
          email = packet.email
          existing_profile = profiles.find do |pro|
            pro.first_name == first_name && pro.last_name == last_name && pro.email == email
          end

          if existing_profile.blank?
            existing_profile = Auditions::Profile.new(
              first_name: packet.name.split[0],
              last_name: packet.name.split[1..-1].join,
              email: packet.email,
              city: packet.city,
              state: packet.state
            )
            profiles << existing_profile
          end

          existing_profile.add_packet(packet.type, packet.date)
        end

        profiles
      end
    end
  end
end
