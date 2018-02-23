class Wwtks < SlackRubyBot::Commands::Base
  match /.*(?:wwtks|what (?:do|would) the kids say)\??(.*)/i do |client, data, matches|

    if matches[1].blank?
      speak client, data.channel
      return
    end

    words = matches[1].split ' '
    return if words.length < 2 || words[0] != 'add'

    saying = words.drop(1).join(' ')
    BotSaying.create saying: saying
    client.say(channel: data.channel, text: "Added saying: #{saying}")
  end

  def self.speak(client, channel)
    possible_sayings = BotSaying.all
    client.say(channel: channel, text: "The kids would say:\n>_#{possible_sayings.sample.saying}_")
  end
end
