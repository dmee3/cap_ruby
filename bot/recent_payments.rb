class RecentPayments < SlackRubyBot::Commands::Base
  match(/^(?:<@U885J7NDS>\s*)?who paid\s*(\d*)$/i) do |client, data, match|
    limit = match[1].to_i.zero? ? 5 : match[1].to_i
    payments = Payment.includes(:user, :payment_type)
                      .order(date_paid: :desc, created_at: :desc)
                      .limit(limit)

    header_text = "The #{payments.length} most recent payments are:"
    client.say(
      channel: data.channel,
      text: header_text << generate_response(payments)
    )
  end

  match(%r{^(?:<@U885J7NDS>\s*)?who paid since (\d+)/(\d+)$}i) do |client, data, match|
    limit_date = "#{match[1]}/#{match[2]}"

    payments = Payment.includes(:user, :payment_type)
                      .where('date_paid >= ?', "#{limit_date}/2019")
                      .order(date_paid: :desc, created_at: :desc)

    header_text = "The payments since #{limit_date} are:"
    client.say(
      channel: data.channel,
      text: header_text << generate_response(payments)
    )
  end

  class << self
    def generate_response(payments)
      ''.tap do |res|
        payment_metrics = { total: 0, types: Hash.new(0) }
        payments.each do |p|
          amount = p.amount.to_f / 100.0
          type = p.payment_type.name

          payment_metrics[:total] += amount
          payment_metrics[:types][type] += amount

          res << "\n*#{p.user.full_name}* _#{format('$%.2f', amount)}_"
          res << "\n>#{p.date_paid.strftime('%a, %-m/%-d')} - #{type}"
        end

        res << "\n\nTotals:"
        res << generate_metrics(payment_metrics)
      end
    end

    def generate_metrics(metrics)
      "\n".tap do |res|
        metrics[:types].each { |type, amt| res << "\n> #{format('$%.2f', amt)} _#{type}_" }
        res << "\n\n*TOTAL: #{format('$%.2f', metrics[:total])}*"
      end
    end
  end
end
