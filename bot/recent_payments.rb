class RecentPayments < SlackRubyBot::Commands::Base
  command 'who paid' do |client, data, match|
    payments = Payment.order(date_paid: :desc).limit 5
    response = "The #{payments.length} most recent payments are:"
    payments.each do |p|
      response << "\n*#{p.user.full_name}* _#{format('$%.2f', p.amount.to_f / 100.0)}_"
      response << "\n>#{p.date_paid.strftime('%a, %-m/%-d')} - #{p.payment_type.name}"
    end

    client.say(channel: data.channel, text: response)
  end
end
