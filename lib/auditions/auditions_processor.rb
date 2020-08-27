class AuditionsProcessor
  class << self
    def run
      orders = SquarespaceApi.get_orders

      registrations = {
        'Music Registrations' => {},
        'Visual Registrations' => {}
      }
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
          elsif item&.type&.include?('Registration')
            registrations[item.type][item.instrument] ||= []
            registrations[item.type][item.instrument] << item
          end
        end
      end

      # Clean up duplicate packet downloads
      packets.each do |packet_name, instruments|
        instruments.each_key { |instr| instruments[instr] = instruments[instr].uniq(&:email).sort_by(&:date) }
      end

      return { registrations: registrations, packets: packets }
    end
  end
end
