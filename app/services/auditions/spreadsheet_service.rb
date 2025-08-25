# frozen_string_literal: true

module Auditions
  class SpreadsheetService
    class << self
      def update
        Logger.step('Auditions spreadsheet update') do
          # Step 1: Fetch and validate data from orders
          fetch_result = OrderService.fetch_items
          return fetch_result if fetch_result.failure?

          registrations = fetch_result.data[:registrations]
          packets = fetch_result.data[:packets]

          Logger.info(
            'Data fetch completed',
            {
              registrations_count: registrations.size,
              packets_count: packets.size
            }
          )

          # Step 2: Write to spreadsheets
          write_result = write_data_with_error_handling(packets, registrations)
          return write_result if write_result.failure?

          # Step 3: Create and validate profiles
          profiles_result = create_profiles_with_validation(registrations, packets)
          return profiles_result if profiles_result.failure?

          # Step 4: Update recruitment sheet
          recruitment_result = update_recruitment_with_error_handling(profiles_result.data)
          return recruitment_result if recruitment_result.failure?

          Logger.info('Auditions spreadsheet update completed successfully')
          Result.success(
            {
              registrations_processed: registrations.size,
              packets_processed: packets.size,
              profiles_created: profiles_result.data.size
            }
          )
        end
      rescue StandardError => e
        Logger.error('Unexpected error in spreadsheet update', e)
        Result.failure(["Unexpected error during spreadsheet update: #{e.message}"])
      end

      private

      def write_data_with_error_handling(packets, registrations)
        Logger.info(
          'Writing data to spreadsheets',
          {
            packets_count: packets.size,
            registrations_count: registrations.size
          }
        )

        begin
          PacketAndRegistrationWriterService.write_data(packets, registrations)
          Logger.info('Successfully wrote data to spreadsheets')
          Result.success(nil)
        rescue StandardError => e
          Logger.error('Failed to write data to spreadsheets', e)
          Result.failure(["Failed to write to spreadsheets: #{e.message}"])
        end
      end

      def create_profiles_with_validation(registrations, packets)
        Logger.info('Creating profiles from data')

        begin
          profiles = create_profiles_from_registrations_and_packets(registrations, packets)

          # Validate the created profiles
          validation_result = DataValidator.validate_profiles(profiles)
          return validation_result if validation_result.failure?

          Logger.info('Successfully created profiles', { count: profiles.size })
          Result.success(profiles)
        rescue StandardError => e
          Logger.error('Failed to create profiles', e)
          Result.failure(["Failed to create profiles: #{e.message}"])
        end
      end

      def update_recruitment_with_error_handling(profiles)
        Logger.info('Updating recruitment sheet', { profiles_count: profiles.size })

        begin
          RecruitmentSheetUpdaterService.update(profiles)
          Logger.info('Successfully updated recruitment sheet')
          Result.success(nil)
        rescue StandardError => e
          Logger.error('Failed to update recruitment sheet', e)
          Result.failure(["Failed to update recruitment sheet: #{e.message}"])
        end
      end

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
        email = packet.email.to_s.strip
        return nil if email.blank?

        profiles.find do |pro|
          next unless pro.email.present? && pro.first_name.present? && pro.last_name.present?

          packet.first_name.to_s.strip.casecmp(pro.first_name.to_s.strip).zero? &&
            packet.last_name.to_s.strip.casecmp(pro.last_name.to_s.strip).zero? &&
            email.casecmp(pro.email.to_s.strip).zero?
        end
      end

      def create_profiles_from_registrations_and_packets(registrations, packets)
        Logger.debug('Creating profiles from registrations and packets')

        profiles = registrations.map.with_index do |reg, index|
          Logger.debug('Creating profile from registration', { index: index + 1, email: reg.email })
          profile_from_registration(reg)
        rescue StandardError => e
          Logger.error(
            'Failed to create profile from registration',
            e,
            {
              index: index + 1,
              email: reg&.email
            }
          )
          nil
        end.compact

        Logger.debug('Processing packets to merge with existing profiles')
        packets.each.with_index do |packet, index|
          existing_profile = find_existing_profile(packet, profiles)

          if existing_profile.blank?
            Logger.debug(
              'Creating new profile from packet',
              {
                index: index + 1,
                email: packet.email
              }
            )
            existing_profile = profile_from_packet(packet)
            profiles << existing_profile
          else
            Logger.debug(
              'Adding packet to existing profile',
              {
                index: index + 1,
                email: packet.email
              }
            )
          end

          existing_profile.add_packet(packet.type, packet.date)
        rescue StandardError => e
          Logger.error(
            'Failed to process packet',
            e,
            {
              index: index + 1,
              email: packet&.email
            }
          )
          # Continue processing other packets
        end

        Logger.info('Profile creation completed', { total_profiles: profiles.size })
        profiles
      end
    end
  end
end
