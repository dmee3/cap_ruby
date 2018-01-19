class Wwtks < SlackRubyBot::Commands::Base
  SAYINGS = [
    'Does grey count as dark, or is it too close to white?',
    'Does it have to be all white, or can it be mostly white?',
    'When do we get member jackets?',
    'I have a callback camp this weekend and have to miss rehearsal',
    'Love, Mom',
    'Bet',
    'I forgot my dues check, can I bring it next weekend?'
  ].freeze

  command 'wwtks' do |client, data, _matches|
    client.say(channel: data.channel, text: "The kids would say:\n>_#{SAYINGS.sample}_")
  end
end
