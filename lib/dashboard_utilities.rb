# frozen_string_literal: true

# rubocop:disable Metrics/AbcSize
class DashboardUtilities
  class << self
    def upcoming_payments(start_date, end_date, season_id)
      schedules = PaymentSchedule.for_season(season_id)
                                 .includes(:payment_schedule_entries, user: :payments)

      schedules = schedules.select do |s|
        s.entries.any? { |e| e.pay_date.between?(start_date, end_date) }
      end

      [].tap do |array|
        schedules.each do |sched|
          entry = sched.entries.sort_by(&:pay_date).find { |e| e.pay_date >= start_date }
          balance = sched.scheduled_to_date(entry.pay_date) - sched.user.amount_paid_for(season_id)
          next if balance <= 0 # Skip if they've paid ahead

          array << {
            pay_date: entry.pay_date.strftime('%-m/%-d/%y'),
            amount: balance.to_f / 100,
            user_id: sched.user_id,
            name: sched.user.full_name
          }
        end
      end
    end

    def recent_payments(start_date, end_date, season_id)
      Payment
        .for_season(season_id)
        .includes(:user)
        .where(date_paid: start_date..end_date)
        .map do |p|
          {
            amount: p.amount.to_f / 100,
            date_paid: p.date_paid.strftime('%-m/%-d/%y'),
            id: p.id,
            name: "#{p.user.first_name} #{p.user.last_name}",
            payment_type: p.payment_type.name,
            user_id: p.user.id
          }
        end
    end

    def upcoming_conflicts(start_date, end_date, season_id)
      conflicts = Conflict.includes(:user, :conflict_status)
                          .for_season(season_id)
                          .where(start_date: start_date..end_date)
                          .order(:start_date)

      conflicts.map do |c|
        {
          start_date: c.start_date,
          end_date: c.end_date,
          name: c.user.full_name,
          status: c.conflict_status.name
        }
      end
    end

    def behind_members(season_id)
      members = User.for_season(season_id).with_payments.with_role(:member).to_a
      members.reject! { |m| m.dues_status_okay?(season_id) }
      members.map do |m|
        {
          id: m.id,
          name: m.full_name,
          paid: m.amount_paid_for(season_id).to_f / 100.0,
          owed: m.payment_schedule_for(season_id).scheduled_to_date.to_f / 100.0
        }
      end
    end

    def biweekly_scheduled
      season_id = Season.last.id
      entries = PaymentScheduleEntry.for_season(season_id).order(:pay_date)
      dates = (entries.first.pay_date..entries.last.pay_date).select { |d| d.wday.zero? }
      dates.map { |d| [d, entries.where('pay_date <= ?', d).sum(:amount).to_f / 100.0] }
    end

    def biweekly_actual
      season_id = Season.last.id
      entries = PaymentScheduleEntry.for_season(season_id).order(:pay_date)
      dates = (entries.first.pay_date..entries.last.pay_date).select { |d| d.wday.zero? }
      dates.map do |d|
        [d, Payment.for_season(season_id).where('date_paid <= ?', d).sum(:amount).to_f / 100.0]
      end
    end
  end
end
# rubocop:enable Metrics/AbcSize
