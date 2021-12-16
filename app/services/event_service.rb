# frozen_string_literal: true

class EventService
  class << self
    def next_event(season_id)
      Event.where(season_id: season_id).select { |e| e[:end_date] >= Date.today }.first
    end
  end

  SEASON_EVENTS = [
    {
      name: 'Rehearsal Weekend',
      start_date: '2021-12-03 7:30 pm',
      end_date: '2021-12-05 06:00 pm',
    },
    {
      name: 'Rehearsal Weekend',
      start_date: '2021-12-10 7:30 pm',
      end_date: '2021-12-12 06:00 pm',
    },
    {
      name: 'Winter Camp #1',
      start_date: '2021-12-17 7:30 pm',
      end_date: '2021-12-21 06:00 pm',
    },
    {
      name: 'Winter Camp #2',
      start_date: '2021-12-27 7:30 pm',
      end_date: '2021-12-30 06:00 pm',
    },
    {
      name: 'Rehearsal Weekend',
      start_date: '2022-01-07 7:30 pm',
      end_date: '2022-01-09 06:00 pm',
    },
    {
      name: 'Rehearsal Weekend',
      start_date: '2022-01-14 7:30 pm',
      end_date: '2022-01-16 06:00 pm',
    },
    {
      name: 'Rehearsal Weekend',
      start_date: '2022-01-21 7:30 pm',
      end_date: '2022-01-23 06:00 pm',
    },
    {
      name: 'Rehearsal Weekend',
      start_date: '2022-01-28 7:30 pm',
      end_date: '2022-01-30 06:00 pm',
    },
    {
      name: 'Show Weekend (OIPA Columbus)',
      start_date: '2022-02-04 7:30 pm',
      end_date: '2022-02-06 06:00 pm',
    },
    {
      name: 'Rehearsal Weekend',
      start_date: '2022-02-11 7:30 pm',
      end_date: '2022-02-13 11:00 pm',
    },
    {
      name: 'Show Weekend (OIPA Firestone)',
      start_date: '2022-02-18 7:30 pm',
      end_date: '2022-02-20 11:00 pm',
    },
    {
      name: 'Rehearsal Weekend',
      start_date: '2022-02-25 7:30 pm',
      end_date: '2022-02-27 11:00 pm',
    },
    {
      name: 'Show Weekend (WGI Indianapolis)',
      start_date: '2022-03-04 7:30 pm',
      end_date: '2022-03-06 11:00 pm',
    },
    {
      name: 'Rehearsal Weekend',
      start_date: '2022-03-11 7:30 pm',
      end_date: '2022-03-13 11:00 pm',
    },
    {
      name: 'Rehearsal Weekend',
      start_date: '2022-03-18 7:30 pm',
      end_date: '2022-03-20 11:00 pm',
    },
    {
      name: 'Show Weekend (WGI Dayton)',
      start_date: '2022-03-25 7:30 pm',
      end_date: '2022-03-27 11:00 pm',
    },
    {
      name: 'Show Weekend (OIPA Championship)',
      start_date: '2022-04-01 7:30 pm',
      end_date: '2022-04-03 11:00 pm',
    },
    {
      name: 'Rehearsal Weekend',
      start_date: '2022-04-08 7:30 pm',
      end_date: '2022-04-10 11:00 pm',
    },
    {
      name: 'Finals Move-Ins',
      start_date: '2022-04-15 7:30 pm',
      end_date: '2022-04-20 11:00 pm',
    },
    {
      name: 'WGI Prelims',
      start_date: '2022-04-21 9:00 am',
      end_date: '2022-04-21 11:00 pm',
    },
    {
      name: 'WGI Semis',
      start_date: '2022-04-22 9:00 am',
      end_date: '2022-04-22 11:00 pm',
    },
    {
      name: 'WGI Finals',
      start_date: '2022-04-23 9:00 am',
      end_date: '2022-04-23 11:00 pm',
    }
  ].freeze
end
