# frozen_string_literal: true

module Admin
  # Builds the filtered / sorted / paginated payments list for the admin
  # payments screen (`/admin/payments` JSON branch) and returns a view-model:
  #
  #   {
  #     payments: [{ id, amount_cents, date_paid, payment_type: { id, name },
  #                  notes, user: { id, name }, deleted: bool }, ...],
  #     total_count:   Integer,  # non-deleted rows matching the filters, always
  #     total_cents:   Integer,  # sum of those non-deleted rows, always
  #     deleted_count: Integer,  # deleted rows matching the filters
  #     returned:      Integer,  # rows in this page
  #     has_more:      bool
  #   }
  #
  # `total_count` / `total_cents` are ALWAYS of non-deleted rows regardless of
  # the `scope` param (design-system §4.21 — "Deleted payments are excluded from
  # every total on this page").
  class PaymentsQuery
    SORT_COLUMNS = {
      'date_paid' => 'payments.date_paid',
      'member' => 'LOWER(users.last_name)',
      'type' => 'LOWER(payment_types.name)',
      'amount' => 'payments.amount'
    }.freeze

    DEFAULT_SORT = 'date_paid'
    DEFAULT_LIMIT = 20
    MAX_LIMIT = 200

    SCOPES = %w[active with_deleted deleted_only].freeze

    def initialize(season_id, params = {})
      @season_id = season_id
      @params = params
    end

    def call
      matched = filtered(base_scope)
      visible = scoped(matched)
      rows = ordered(visible).offset(offset).limit(limit).to_a

      {
        payments: rows.map { |p| serialize(p) },
        total_count: non_deleted(matched).count,
        total_cents: non_deleted(matched).sum(:amount),
        deleted_count: deleted(matched).count,
        returned: rows.length,
        has_more: offset + rows.length < visible.count
      }
    end

    private

    attr_reader :season_id, :params

    # Always start from `with_deleted` so the scope param can widen or narrow;
    # totals re-filter to non-deleted below.
    def base_scope
      Payment
        .with_deleted
        .includes(:user, :payment_type)
        .joins(:user, :payment_type)
        .for_season(season_id)
    end

    def filtered(relation)
      relation = by_name(relation)
      relation = by_type(relation)
      by_date_range(relation)
    end

    def by_name(relation)
      term = params[:q].to_s.strip
      return relation if term.blank?

      like = "%#{term.downcase}%"
      relation.where(
        'LOWER(users.first_name) LIKE :like OR LOWER(users.last_name) LIKE :like ' \
        "OR LOWER(users.first_name || ' ' || users.last_name) LIKE :like",
        like: like
      )
    end

    def by_type(relation)
      type_id = params[:type_id].presence
      return relation if type_id.nil?

      relation.where(payment_type_id: type_id)
    end

    def by_date_range(relation)
      start_date = parse_date(params[:start_date])
      end_date = parse_date(params[:end_date])
      relation = relation.where('payments.date_paid >= ?', start_date) if start_date
      relation = relation.where('payments.date_paid <= ?', end_date) if end_date
      relation
    end

    # Apply the visible-rows scope. Totals never go through here.
    def scoped(relation)
      case scope
      when 'with_deleted' then relation
      when 'deleted_only' then relation.where.not(payments: { deleted_at: nil })
      else relation.where(payments: { deleted_at: nil })
      end
    end

    def non_deleted(relation)
      relation.where(payments: { deleted_at: nil }).reorder(nil)
    end

    def deleted(relation)
      relation.where.not(payments: { deleted_at: nil }).reorder(nil)
    end

    def ordered(relation)
      relation.reorder(Arel.sql("#{sort_column} #{direction}, payments.id #{direction}"))
    end

    def serialize(payment)
      {
        id: payment.id,
        amount_cents: payment.amount,
        date_paid: payment.date_paid&.iso8601,
        payment_type: { id: payment.payment_type_id, name: payment.payment_type.name },
        notes: payment.notes,
        user: { id: payment.user_id, name: payment.user.full_name },
        deleted: payment.deleted_at.present?
      }
    end

    def sort_column
      SORT_COLUMNS.fetch(params[:sort].to_s, SORT_COLUMNS.fetch(DEFAULT_SORT))
    end

    def direction
      params[:dir].to_s.downcase == 'asc' ? 'asc' : 'desc'
    end

    def scope
      SCOPES.include?(params[:scope].to_s) ? params[:scope].to_s : 'active'
    end

    def limit
      raw = params[:limit].to_i
      return DEFAULT_LIMIT unless raw.positive?

      [raw, MAX_LIMIT].min
    end

    def offset
      [params[:offset].to_i, 0].max
    end

    def parse_date(value)
      return nil if value.blank?

      Date.parse(value.to_s)
    rescue ArgumentError, TypeError
      nil
    end
  end
end
