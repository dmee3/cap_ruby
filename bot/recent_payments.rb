class RecentPayments < SlackRubyBot::Commands::Base
  match /^(?:<@U885J7NDS>\s*)?who paid\s*(\d*)$/ do |client, data, matches|
    limit = matches[1]&.strip&.to_i || 5
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
