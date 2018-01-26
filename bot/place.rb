class Place < SlackRubyBot::Commands::Base
  PLACES = *(5..25).freeze # Array from Range using splat operator
  BAD_REASONS = [
    'Somebody forgot the flashlights',
    'Dan left the kingpin key in his car',
    "The uniforms weren't in yet",
    "Nola is on the panel... _we're done here!_",
    "The snares keep missing for corps camps and can't play together",
    "We couldn't connect to the router in the mixer cart",
    "Stew couldn't stop puking in the lot",
    'Shaun got lost picking up the trailer',
    'The bass solo changed again',
    'They mispronounced our show name.  Wentu Worlds, Co. Lied',
    "We were just bad",
    'We left part of the prop in the lot',
    "The generator wouldn't start for warmup",
    'Fucking STRYKE and that hot redhead, man',
    'We took a huge timing penalty',
    'The staff unfolded the tarp wrong'
  ].freeze
  GOOD_REASONS = [
    'Things actually went pretty well for once',
    "Matrix's sound system didn't work",
    'Matt Stevens was on the panel',
    'Omar likes how Donnie writes',
    'Broken City folded',
    'Pulse was boycotting WGI because Ian got pissy about sample length'
  ].freeze

  command 'what place will we get?' do |client, data, _matches|
    place = PLACES.sample
    reason = place < 13 ? GOOD_REASONS.sample : BAD_REASONS.sample
    case place
    when 21
      ordinal = 'st'
    when 22
      ordinal = 'nd'
    when 23
      ordinal = 'rd'
    else
      ordinal = 'th'
    end
    client.say(channel: data.channel, text: "We'll be in #{place}#{ordinal} because #{reason}")
  end
end
