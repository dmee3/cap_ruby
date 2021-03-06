class OrderProcessor
  class << self
    def run(order_json)
      order_num = order_json['orderNumber']
      date = DateTime.parse(order_json['createdOn'])

      order_json['lineItems'].map do |item|
        if REGISTRATION_PRODUCTS.keys.include?(item['productName'])
          create_registration(item, date, order_num)
        elsif PACKET_PRODUCTS.keys.include?(item['productName'])
          create_packet(item, date, order_num)
        end
      end
    end

    private

    REGISTRATION_PRODUCTS = {
      'CC21 Music Ensemble Video Audition' => 'Music Registrations',
      'CC21 Visual Ensemble Video Audition'  => 'Visual Registrations'
    }.freeze

    PACKET_PRODUCTS = {
      '2021 CC2 Battery Audition Packet' => 'CC2 Battery Packets',
      '2021 Cap City World Battery Audition Packet' => 'World Battery Packets',
      '2021 Cap City Cymbal Audition Packet' => 'Cymbal Packets',
      '2021 Cap City Front Ensemble Audition Packet' => 'Front Packets'
    }.freeze

    REGISTRATION_ORDER_INSTR_MAP = {
      '1260' => 'Vibes'
    }.freeze

    PACKET_ORDER_INSTR_MAP = {
      '1049' => 'Snare',      '1050' => 'Vibes',    '1051' => 'Marimba',
      '1052' => 'Auxiliary',  '1053' => 'Marimba',  '1054' => 'Tenors',
      '1055' => 'Tenors',     '1056' => 'Marimba',  '1057' => 'Snare',
      '1058' => 'Cymbals',    '1059' => 'Tenors',   '1060' => 'Bass',
      '1061' => 'Snare',      '1062' => 'Snare',    '1063' => 'Snare',
      '1064' => 'Marimba',    '1065' => 'Marimba'
    }.freeze

    def create_packet(item, date, order_num)

      # Fix for when form was missing instrument
      if order_num.to_i >= 1049 && order_num.to_i < 1066
        field = { 'label' => 'Primary Instrument', 'value' => PACKET_ORDER_INSTR_MAP[order_num] }
        item['customizations'] << field
      end

      args = { date: date, type: PACKET_PRODUCTS[item['productName']] }
      item['customizations'].each do |field|
        case field['label']
        when 'Name'
          args[:name] = field['value']
        when 'Email'
          args[:email] = field['value']
        when 'City'
          args[:city] = field['value']
        when 'State'
          args[:state] = field['value']
        when 'Primary Instrument'
          args[:instrument] = field['value']
        end
      end

      Packet.new(args)
    end

    def create_registration(item, date, order_num)
      # Fix for people who signed up on the wrong instrument
      if REGISTRATION_ORDER_INSTR_MAP.keys.include?(order_num)
        item['customizations'].reject! { |f| f['label'] == 'First Instrument Choice' }
        field = { 'label' => 'First Instrument Choice', 'value' => REGISTRATION_ORDER_INSTR_MAP[order_num] }
        item['customizations'] << field
      end

      args = { date: date, type: REGISTRATION_PRODUCTS[item['productName']] }
      item['customizations'].each do |field|
        case field['label']
        when 'Name'
          args[:name] = field['value']
        when 'Email'
          args[:email] = field['value']
        when 'Phone'
          args[:phone] = field['value']
        when 'City'
          args[:city] = field['value']
        when 'State'
          args[:state] = field['value']
        when 'First Instrument Choice'
          args[:instrument] = field['value']
        when 'Experience'
          args[:experience] = field['value']
        when 'Age on 4/1/2021'
          args[:age_in_april] = field['value']
        end
      end

      Registration.new(args)
    end
  end
end
