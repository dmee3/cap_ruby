class Packet
  attr_reader :type, :name, :email, :city, :state, :instrument, :date

  def initialize(args)
    @type = args[:type]
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
