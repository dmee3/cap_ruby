class Points < SlackRubyBot::Commands::Base
  match /^([\s\w'@.\-:<>]*)\s*([-+]{2}|—)(?:\s+(?:for|because|cause|cuz)\s+(.+))?$/i do |client, data, matches|
    name = matches[1]&.strip&.gsub(/^lil_botty/, '')
    op = matches[2]&.strip
    reason = matches[3]&.strip

    subject = name.blank? ? last_score : find_or_create_score(name, reason)

    update_score(subject, op)

    points = BotPoint.where(name: subject.name).sum(:score)

    response = "#{subject.name} has #{points} point#{'s' unless points.abs == 1}"
    unless subject.reason.blank?
      response << ", #{subject.score} of which #{subject.score.abs == 1 ? 'is' : 'are'}"
      response << " for #{subject.reason}"
    end

    client.say(channel: data.channel, text: response)
  end

  command 'scoreboard' do |client, data, _matches|
    response = "*Here's the current score:*\n".tap do |s|
      find_all_scores.each do |score|
        s << "\n#{score[0]} has #{score[1]} point#{'s' unless score[1] == 1}"
      end
    end

    client.say(channel: data.channel, text: response)
  end

  class << self
    def update_score(subject, op)
      subject.touch
      subject.score = 0 if subject.score.nil?
      subject.score += (op == '++' ? 1 : -1)
      subject.save
    end

    def last_score
      BotPoint.order(updated_at: :desc).first
    end

    def find_all_scores
      BotPoint.group(:name)
              .sum(:score)
              .sort_by(&:last)
              .reverse
    end

    def find_or_create_score(name, reason)
      BotPoint.find_or_create_by(name: name, reason: reason)
    end
  end
end
