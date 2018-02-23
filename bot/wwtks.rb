class Wwtks < SlackRubyBot::Commands::Base
  match /.*(?:wwtks|what (?:do|would) the kids say)\??(.*)/i do |client, data, matches|
    if matches[1].blank?
      speak client, data.channel
      return
    end

    words = matches[1].split ' '
    if words[0] == 'add'
      add(words.drop(1).join(' '), client, data.channel)
    elsif words[0] == 'list'
      list(client, data.channel)
    end
  end

  class << self
    def speak(client, channel)
      possible_sayings = BotSaying.all
      client.say(channel: channel, text: "The kids would say:\n>_#{possible_sayings.sample.saying}_")
    end

    def add(saying, client, channel)
      BotSaying.create saying: saying
      client.say(channel: channel, text: "Added saying: _#{saying}_")
    end

    def list(client, channel)
      sayings = BotSaying.all
      response = "Here's everything the kids would say:"
      sayings.each { |s| response << "\n>- _#{s.saying}_" }
      client.say(channel: channel, text: response)
    end
  end
end
