class AuditionsProcessor
  class << self
    def run
      orders = SquarespaceApi.get_orders

      # Data structure:
      #   registrations: {
      #     'music': {
      #       'snare': [
      #         Registration,
      #         Registration,
      #         ...
      #       ],
      #       'tenors': [ ... ],
      #       ...
      #     },
      #     'visual': {
      #       'dance': [ ... ]
      #     }
      #   }
      #
      registrations, packets = {}, {}
      orders.each do |order|
        OrderProcessor.run(order).each do |item|
          if item&.item&.include?('Packet')
            packets[item.item] ||= {}
            packets[item.item][item.instrument] ||= []
            packets[item.item][item.instrument] << item
          elsif item&.item&.include?('Registration')
            registrations[item.item] ||= {}
            registrations[item.item][item.instrument] ||= []
            registrations[item.item][item.instrument] << item
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
