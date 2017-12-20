class LilBotty < SlackRubyBot::Bot
  require 'upcoming_conflicts'
  require 'recent_payments'
  require 'points'

  help do
    title 'Lil Botty'
    desc 'Cold like Minnesota'

    command 'conflicts' do
      desc 'Shows the conflicts coming up within the next week'
      long_desc 'Shows all conflicts coming up within the next week, along with their status (approved/denied/pending) and reason'
    end

    command 'who paid' do
      desc 'Lists the 5 most recent payments'
      long_desc 'Lists the 5 most recent payments and details (amount, method, etc).  You can pass a different number (e.g. `who paid 10`) to see more recent payments.'
    end
  end
end