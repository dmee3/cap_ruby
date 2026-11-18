# frozen_string_literal: true

# Per-ensemble dues as of a date: who is behind or ahead of their own schedule
# and by how much, and what would be due by then on the default schedules
# against what is due on the schedules members actually have. Feeds the admin
# dashboard's "Ahead vs. behind" and "Default vs. custom" views.
class DuesBreakdown
  NO_ENSEMBLE = 'No ensemble'

  def self.call(season_id, on: Date.current)
    new(season_id, on).call
  end

  def initialize(season_id, on)
    @season_id = season_id
    @on = on
  end

  def call
    members.group_by { |m| m.ensemble_for(@season_id) || NO_ENSEMBLE }
           .sort_by { |ensemble, _| [ensemble == NO_ENSEMBLE ? 1 : 0, ensemble] }
           .map { |ensemble, group| row(ensemble, group.map { |m| member_figures(m) }) }
  end

  private

  def row(ensemble, figures)
    behind = figures.select { |f| f[:balance].negative? }
    ahead = figures.select { |f| f[:balance].positive? }
    {
      ensemble: ensemble,
      member_count: figures.size,
      behind_count: behind.size,
      behind_cents: -behind.sum { |f| f[:balance] },
      ahead_count: ahead.size,
      ahead_cents: ahead.sum { |f| f[:balance] },
      custom_count: figures.count { |f| f[:custom] },
      no_default_count: figures.count { |f| f[:default_due].nil? },
      default_due_cents: figures.sum { |f| f[:default_due] || f[:due] },
      due_cents: figures.sum { |f| f[:due] },
      collected_cents: figures.sum { |f| f[:paid] }
    }
  end

  def member_figures(member)
    own = member.payment_schedule_for(@season_id)&.entries.to_a.map { |e| [e.pay_date, e.amount] }.sort
    default = default_for(member)
    due = due_by(own)
    paid = member.amount_paid_for(@season_id)
    {
      due: due,
      paid: paid,
      balance: paid - due,
      # A member whose combination has no default can't be measured against
      # one; the totals count their own schedule instead and say how many.
      default_due: default && due_by(default),
      custom: default.present? && own.any? && own != default
    }
  end

  def due_by(entries)
    entries.select { |date, _| date <= @on }.sum(&:last)
  end

  def default_for(member)
    return nil if member.ensemble_for(@season_id).blank?

    defaults[DefaultSchedules::Combination.for_member(member, @season_id)]
  end

  def defaults
    @defaults ||= DefaultScheduleEntry.where(season_id: @season_id)
                                      .group_by { |r| DefaultSchedules::Combination.new(r.ensemble, r.section_group, r.vet_status) }
                                      .transform_values { |rows| rows.map { |r| [r.pay_date, r.amount_cents] }.sort }
  end

  def members
    User.members_for_season(@season_id).with_payments.includes(seasons_users: :season).to_a.uniq
  end
end
