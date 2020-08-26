class Registration
  attr_reader :item, :name, :email, :phone, :city, :state, :instrument, :date, :experience, :age_in_april

  def initialize(args)
    @item = args[:item].gsub('CC21 ', '').gsub('Video Audition', 'Registration')
    @name = args[:name]
    @email = args[:email]
    @city = args[:city]
    @state = args[:state]
    @instrument = args[:instrument]
    @date = args[:date]
    @experience = args[:experience]
    @age_in_april = args[:age_in_april]
  end

  def to_row
    [@instrument, @name, @email, @city, @state, @age_in_april, @date.strftime("%-m/%-d %-l:%M %P"), @experience]
  end

  class << self
    def header_row
      ['Instrument', 'Name', 'Email', 'City', 'State', 'Age in April', 'Downloaded', 'Experience']
    end
  end
end
