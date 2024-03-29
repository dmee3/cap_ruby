# frozen_string_literal: true

module Auditions
  class StateConverterService
    def self.abbreviation(state)
      return state.upcase if state.length == 2

      STATE_NAME_TO_ABBR[state.downcase] || state
    end

    STATE_NAME_TO_ABBR = {
      'alabama' => 'AL',
      'alaska' => 'AK',
      'america samoa' => 'AS',
      'arizona' => 'AZ',
      'arkansas' => 'AR',
      'california' => 'CA',
      'colorado' => 'CO',
      'connecticut' => 'CT',
      'delaware' => 'DE',
      'district of columbia' => 'DC',
      'washington d.c.' => 'DC',
      'washington dc' => 'DC',
      'federated states of micronesia' => 'FM',
      'micronesia' => 'FM',
      'florida' => 'FL',
      'georgia' => 'GA',
      'guam' => 'GU',
      'hawaii' => 'HI',
      'idaho' => 'ID',
      'illinois' => 'IL',
      'indiana' => 'IN',
      'iowa' => 'IA',
      'kansas' => 'KS',
      'kentucky' => 'KY',
      'louisiana' => 'LA',
      'maine' => 'ME',
      'maryland' => 'MD',
      'massachusetts' => 'MA',
      'marshall islands' => 'MH',
      'michigan' => 'MI',
      'minnesota' => 'MN',
      'mississippi' => 'MS',
      'missouri' => 'MO',
      'montana' => 'MT',
      'nebraska' => 'NE',
      'nevada' => 'NV',
      'new hampshire' => 'NH',
      'new jersey' => 'NJ',
      'new mexico' => 'NM',
      'new york' => 'NY',
      'north carolina' => 'NC',
      'north dakota' => 'ND',
      'northern mariana islands' => 'MP',
      'mariana islands' => 'MP',
      'ohio' => 'OH',
      'oklahoma' => 'OK',
      'oregon' => 'OR',
      'palau' => 'PW',
      'pennsylvania' => 'PA',
      'puerto rico' => 'PR',
      'rhode island' => 'RI',
      'south carolina' => 'SC',
      'south dakota' => 'SD',
      'tennessee' => 'TN',
      'texas' => 'TX',
      'utah' => 'UT',
      'vermont' => 'VT',
      'virgin island' => 'VI',
      'virginia' => 'VA',
      'washington' => 'WA',
      'west virginia' => 'WV',
      'wisconsin' => 'WI',
      'wyoming' => 'WY'
    }.freeze
  end
end
