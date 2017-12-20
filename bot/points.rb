class Points < SlackRubyBot::Commands::Base
  match /^([\s\w'@.\-:<>]*)\s*([-+]{2}|—)(?:\s+(?:for|because|cause|cuz)\s+(.+))?$/i do |client, data, matches|
    name = matches[1]&.strip
    op = matches[2]&.strip
    reason = matches[3]&.strip

    if name.blank?
      subject, entry = find_last_score(data.channel)
      name = subject.name
    else
      subject, entry = find_or_create_score(name, data.channel, reason)
    end

    update_score(subject, op, entry)

    points = BotPointEntry.where(bot_point_id: subject.id).sum(:score)

    response = "#{name} has #{points} point#{points.abs == 1 ? '' : 's'}"
    unless entry.reason.blank?
      response << ", #{entry.score} of which #{entry.score.abs == 1 ? 'is' : 'are'} for #{entry.reason}"
    end

    client.say(channel: data.channel, text: response)
  end

  command 'scoreboard' do |client, data, _matches|
    response = "*Here's the current score for this channel:*\n".tap do |s|
      find_all_scores(data.channel).each do |score|
        s << "\n#{score[0]} has #{score[1]} point#{'s' unless score[1] == 1}"
      end
    end

    client.say(channel: data.channel, text: response)
  end

  class << self
    def update_score(subject, op, entry)
      subject.touch
      entry.score = 0 if entry.score.nil?
      entry.score += (op == '++' ? 1 : -1)
      entry.save
    end

    def find_last_score(room)
      subject = BotPoint.where(room: room)
                        .order(updated_at: :desc)
                        .first
      entry = BotPointEntry.where(bot_point_id: subject.id)
                           .order(updated_at: :desc)
                           .first
      [subject, entry]
    end

    def find_all_scores(room)
      BotPoint.includes(:bot_point_entries)
              .where(room: room)
              .group(:name)
              .sum('bot_point_entries.score')
              .sort_by(&:last)
              .reverse
    end

    def find_or_create_score(name, room, reason)
      subject = BotPoint.find_or_create_by(name: name, room: room)
      entry = BotPointEntry.where(bot_point_id: subject.id)
                           .where(reason: reason)
                           .first_or_create
      [subject, entry]
    end
  end
end