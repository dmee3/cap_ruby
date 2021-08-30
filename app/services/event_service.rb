# frozen_string_literal: true

class EventService
  class << self
    def next_event
      SEASON_EVENTS.select { |e| e[:start_date] >= Date.today }.first
    end
  end

  SEASON_EVENTS = [
    {
      name: 'Audition #1',
      start_date: DateTime.parse('2021-09-26 10:00 am'),
      end_date: DateTime.parse('2021-09-26 06:00 pm')
    },
    {
      name: 'Audition #2',
      start_date: DateTime.parse('2021-10-03 10:00 am'),
      end_date: DateTime.parse('2021-10-03 06:00 pm')
    },
    {
      name: 'Audition #3',
      start_date: DateTime.parse('2021-10-10 10:00 am'),
      end_date: DateTime.parse('2021-10-10 06:00 pm')
    },
    {
      name: 'Rehearsal',
      start_date: DateTime.parse('2021-10-17 10:00 am'),
      end_date: DateTime.parse('2021-10-17 06:00 pm')
    },
    {
      name: 'Zoom Rehearsal',
      start_date: DateTime.parse('2021-10-31 10:00 am'),
      end_date: DateTime.parse('2021-10-31 06:00 pm')
    },
    {
      name: 'Rehearsal',
      start_date: DateTime.parse('2021-11-07 10:00 am'),
      end_date: DateTime.parse('2021-11-07 06:00 pm')
    },
    {
      name: 'Zoom Rehearsal',
      start_date: DateTime.parse('2021-11-14 10:00 am'),
      end_date: DateTime.parse('2021-11-14 06:00 pm')
    }
  ].freeze
end
