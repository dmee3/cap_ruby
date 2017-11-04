module Season
  def self.season_start
    Date.parse('2017-10-15')
  end

  def self.season_end
    Date.parse('2018-04-22')
  end

  def self.default_payment_schedule
    [
      { amount: 30000, pay_date: season_start },
      { amount: 23000, pay_date: Date.parse('2017-11-19') },
      { amount: 23000, pay_date: Date.parse('2017-12-17') },
      { amount: 23000, pay_date: Date.parse('2018-01-14') },
      { amount: 23000, pay_date: Date.parse('2018-02-11') },
      { amount: 23000, pay_date: Date.parse('2018-03-11') }
    ]
  end
end