class AuditionsProcessor
  class << self
    def run
      orders = SquarespaceApi.get_orders

      music_list = RegistrationList.new
      visual_list = RegistrationList.new
      packets = {
        'CC2 Battery Packets' => {},
        'World Battery Packets' => {},
        'Cymbal Packets' => {},
        'Front Packets' => {}
      }
      orders.each do |order|
        OrderProcessor.run(order).each do |item|
          if item&.type&.include?('Packet')
            packets[item.type][item.instrument] ||= []
            packets[item.type][item.instrument] << item
          elsif item&.type == 'Music Registrations'
            music_list.registrations << item
          elsif item&.type == 'Visual Registrations'
            visual_list.registrations << item
          end
        end
      end

      # Clean up duplicate packet downloads
      packets.each do |packet_name, instruments|
        instruments.each_key { |instr| instruments[instr] = instruments[instr].uniq(&:email).sort_by(&:date) }
      end

      return { music: music_list, visual: visual_list, packets: packets }
    end
  end
end
