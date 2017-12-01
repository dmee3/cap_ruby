class UpcomingConflicts < SlackRubyBot::Commands::Base
  command 'conflicts' do |client, data, match|
    conflicts = Conflict.where('start_date >= ?', Date.today)
                        .where('start_date <= ?', Date.today + 7.days)
                        .order :start_date

    response = "There are #{conflicts.length} conflicts within the next week"
    conflicts.each do |c|
      response << "\n*#{c.user.full_name}* _(#{c.status.name})_ - #{c.start_date.strftime('%a, %-m/%-d %I:%M %p')} to #{c.end_date.strftime('%a, %-m/%-d %I:%M %p')}\n>#{c.reason}"
    end

    client.say(channel: data.channel, text: response)
  end
end
