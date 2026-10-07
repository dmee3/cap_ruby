# frozen_string_literal: true

module DefaultSchedules
  # Everything the overview, copy and editor screens show about one season's
  # eight defaults, and the members each one applies to.
  class Overview
    def self.call(season)
      new(season).call
    end

    def initialize(season)
      @season = season
    end

    def call
      {
        season: { id: @season.id, year: @season.year },
        member_count: members.size,
        blank_schedule_count: blank_members.size,
        set_up_count: combinations.count { |c| c[:set_up] },
        dates: combinations.flat_map { |c| c[:entries].map { |e| e[:pay_date] } }.uniq.sort,
        combinations: combinations,
        copy_source: copy_source
      }
    end

    private

    def combinations
      @combinations ||= Combination.all.map { |combination| combination_view(combination) }
    end

    def combination_view(combination)
      rows = rows_by_combination.fetch(combination, []).sort_by(&:pay_date)
      in_it = members_by_combination.fetch(combination, [])
      {
        slug: combination.slug,
        label: combination.label,
        ensemble: combination.ensemble,
        section_group: combination.section_group,
        vet_status: combination.vet_status,
        set_up: rows.any?,
        entries: rows.map { |row| { pay_date: row.pay_date.iso8601, amount_cents: row.amount_cents } },
        total_cents: rows.sum(&:amount_cents),
        last_changed_on: rows.map(&:updated_at).max&.to_date&.iso8601,
        member_count: in_it.size,
        blank_schedule_count: (in_it & blank_members).size
      }
    end

    def rows_by_combination
      @rows_by_combination ||= DefaultScheduleEntry.where(season: @season).group_by do |row|
        Combination.new(row.ensemble, row.section_group, row.vet_status)
      end
    end

    def members
      @members ||= User.members_for_season(@season.id).includes(seasons_users: :season).to_a
    end

    # Someone with no ensemble yet belongs to no combination.
    def members_by_combination
      @members_by_combination ||= members.select { |m| m.ensemble_for(@season.id).present? }
                                         .group_by { |m| Combination.for_member(m, @season.id) }
    end

    def blank_members
      @blank_members ||= PaymentScheduleService.blank_schedule_members(@season.id).to_a
    end

    # The newest earlier season that has defaults, offered as what to copy from.
    def copy_source
      source = Season.where(id: DefaultScheduleEntry.select(:season_id))
                     .where(year: ...@season.year)
                     .order(year: :desc)
                     .first
      return nil if source.nil?

      rows = DefaultScheduleEntry.where(season: source)
      totals = rows.group(:ensemble, :section_group, :vet_status).sum(:amount_cents).values
      {
        id: source.id,
        year: source.year,
        combination_count: totals.size,
        min_total_cents: totals.min,
        max_total_cents: totals.max,
        payment_count: rows.distinct.count(:pay_date),
        first_date: rows.minimum(:pay_date).iso8601,
        last_date: rows.maximum(:pay_date).iso8601
      }
    end
  end
end
