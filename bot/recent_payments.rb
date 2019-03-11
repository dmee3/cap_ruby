class RecentPayments < SlackRubyBot::Commands::Base
  match(/^(?:<@U885J7NDS>\s*)?who paid\s*(\d*)$/i) do |client, data, match|
    limit = match[1].to_i.zero? ? 5 : match[1].to_i
    payments = Payment.includes(:user, :payment_type)
                      .order(date_paid: :desc, created_at: :desc)
                      .limit(limit)

    response = "The #{payments.length} most recent payments are:"

    payment_metrics = { total: 0, types: {} }

    payments.each do |p|
      amount = p.amount.to_f / 100.0
      payment_type = p.payment_type.name

      payment_metrics[:total] += amount
      payment_metrics[:types][payment_type] = (payment_metrics[:types][payment_type] || 0) + amount

      response << "\n*#{p.user.full_name}* _#{format('$%.2f', amount)}_"
      response << "\n>#{p.date_paid.strftime('%a, %-m/%-d')} - #{payment_type}"
    end

    response << generate_metrics(payment_metrics)

    client.say(channel: data.channel, text: response)
  end

  class << self
    def generate_metrics(metrics)
      "\n".tap do |res|
        metrics[:types].each { |type, amt| res << "\n> $#{format('$%.2f', amt)} _#{type}_" }
        res << "\n\n*TOTAL: $#{format('$%.2f', metrics[:total])}*"
      end
    end
  end
end
