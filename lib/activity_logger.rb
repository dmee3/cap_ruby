# frozen_string_literal: true

class ActivityLogger
  class << self
    def log_activity(args)
      Activity.create(
        user_id: args[:user_id],
        description: args[:description],
        activity_date: args[:activity_date],
        created_by_id: args[:created_by_id],
        activity_type: args[:activity_type]
      )
    rescue StandardError => e
      Rollbar.error(e, user: User.find(args[:user_id]))
    end

    def log_conflict(conflict, current_user)
      return unless conflict

      start = conflict.start_date.strftime('%a, %-m/%-d %I:%M %p')
      status = conflict.status.name.downcase
      log_activity(
        user_id: conflict.user_id,
        description: "Conflict for #{start} marked #{status}",
        activity_date: Date.today,
        created_by_id: current_user.id,
        activity_type: 'conflict'
      )
    end

    def log_payment(payment, user)
      return unless payment

      amount = '%.2f' % (payment.amount / 100.0)
      log_activity(
        user_id: payment.user_id,
        description: "Payment of $#{amount} made",
        activity_date: payment.date_paid,
        created_by_id: user.id,
        activity_type: 'payment'
      )
    end
  end
end
