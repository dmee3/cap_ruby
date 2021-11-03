# frozen_string_literal: true

class PaymentScheduleService
  class << self
    def ensure_payment_schedules_for_user(user)
      user.seasons_users.each do |su|
        next if su.role != 'member' || user.payment_schedule_for(su.season_id).present?

        PaymentSchedule.create(user_id: user.id, season_id: su.season_id)
      end
    end
  end
end
