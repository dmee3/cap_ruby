class LilBotty < SlackRubyBot::Bot
  match /^([\s\w'@.\-:]*)\s*([-+]{2}|—)(?:\s+(?:for|because|cause|cuz)\s+(.+))?$/i do |client, data, matches|
    name = matches[1]&.strip
    op = matches[2]&.strip
    reason = matches[3]&.strip

    return if name.nil?

    subject = BotPoint.find_or_create_by(name: name, room: data.channel)
    entry = BotPointEntry.where(bot_point_id: subject.id)
                          .where(reason: reason)
                          .first_or_create

    entry.score = 0 if entry.score.nil?
    entry.score += (op == '++' ? 1 : -1)
    entry.save

    points = BotPointEntry.where(bot_point_id: subject.id).sum(:score)

    response = "#{name} has #{points} point#{points.abs == 1 ? '' : 's'}"
    unless reason.nil?
      response << ", #{entry.score} of which #{entry.score.abs == 1 ? 'is' : 'are'} for #{entry.reason}"
    end

    client.say(channel: data.channel, text: response)
  end
end
