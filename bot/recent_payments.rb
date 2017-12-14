class RecentPayments < SlackRubyBot::Commands::Base
  match /^(?:<@U885J7NDS>\s*)?who paid\s*(\d*)$/i do |client, data, match|
    limit = match[1].to_i.zero? ? 5 : match[1].to_i
    payments = Payment.includes(:user, :payment_type)
                      .order(date_paid: :desc, created_at: :desc)
                      .limit(limit)
    response = "The #{payments.length} most recent payments are:"
    payments.each do |p|
      response << "\n*#{p.user.full_name}* _#{format('$%.2f', p.amount.to_f / 100.0)}_"
      response << "\n>#{p.date_paid.strftime('%a, %-m/%-d')} - #{p.payment_type.name}"
    end

    client.say(channel: data.channel, text: response)
  end
end
