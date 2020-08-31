class RegistrationList
  attr_reader :registrations

  def initialize(registrations = [])
    @registrations = registrations
  end

  def emails
    registrations.map(&:email)
  end

  def by_instrument
    {}.tap do |h|
      registrations.each do |r|
        h[r.instrument] ||= []
        h[r.instrument] << r
      end
    end
  end
end