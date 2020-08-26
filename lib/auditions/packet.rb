class Packet
  attr_reader :item, :name, :email, :city, :state, :instrument, :date

  def initialize(args)
    @item = args[:item].gsub('2021 ', '').gsub('Cap City ', '')
    @name = args[:name]
    @email = args[:email]
    @city = args[:city]
    @state = args[:state]
    @instrument = args[:instrument]
    @date = args[:date]
  end

  def to_row
    [@instrument, @name, @email, @city, @state, @date.strftime("%-m/%-d %-l:%M %P")]
  end

  class << self
    def header_row
      ['Instrument', 'Name', 'Email', 'City', 'State', 'Downloaded']
    end
  end
end
