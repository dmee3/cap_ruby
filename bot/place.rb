class Place < SlackRubyBot::Commands::Base
  PLACES = *(5..25).freeze # Array from Range using splat operator
  BAD_REASONS = [
    'somebody forgot the flashlights',
    'Dan left the kingpin key in his car',
    "the uniforms weren't in yet",
    "Nola is on the panel... _we're done here!_",
    "the snares keep missing for corps camps and can't play together",
    "we couldn't connect to the router in the mixer cart",
    "Stew couldn't stop puking in the lot",
    'Shaun got lost picking up the trailer',
    'the bass solo changed again',
    'they mispronounced our show name.  Wentu Worlds, Co. Lied',
    "we were just bad",
    'we left part of the prop in the lot',
    "the generator wouldn't start for warmup",
    'fucking STRYKE and that hot redhead, man',
    'we took a huge timing penalty',
    'the staff unfolded the tarp wrong'
  ].freeze
  GOOD_REASONS = [
    'things actually went pretty well for once',
    "Matrix's sound system didn't work",
    'Matt Stevens was on the panel',
    'Omar likes how Donnie writes',
    'Broken City folded',
    'Pulse was boycotting WGI because Ian got pissy about sample length'
  ].freeze

  command 'place', 'what place will we get?' do |client, data, _matches|
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
