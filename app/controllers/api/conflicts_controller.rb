# frozen_string_literal: true

module Api
  # The one conflicts endpoint for both roles. Replaces the byte-identical
  # Api::Admin::ConflictsController and Api::Coordinators::ConflictsController
  # (Flow 5) — nothing on the triage screen is admin-only, so a second copy was
  # a route and a shell, not a second behaviour.
  class ConflictsController < ApiController
    STATUS_SCOPES = %w[Pending Approved Denied Resolved].freeze
    WHEN_SCOPES = %w[upcoming past all].freeze

    before_action :authenticate_user!
    before_action -> { redirect_if_not('admin', 'coordinator') }

    def index
      conflicts = filtered_conflicts
      render(
        json: {
          # Grouped by date: the queue is worked through chronologically.
          groups: ConflictTriagePresenter.date_groups_for(conflicts, season_id, current_user),
          # The calendar needs ungrouped events; the queue needs groups. Same
          # dataset, two shapes, one request.
          conflicts: conflicts.map { |conflict| calendar_event(conflict) },
          counts: status_counts
        }
      )
    end

    def update
      @conflict = season_conflicts.find(params[:id])
      if @conflict.update(conflict_params.reject { |_k, v| v.blank? })
        ActivityLogger.log_conflict(@conflict, current_user)
        render(json: { message: "Conflict for #{@conflict.user.full_name} updated" })
      else
        Rollbar.info('Conflict could not be updated.', errors: @conflict.errors.full_messages)
        head(422)
      end
    end

    # Bulk approve/deny, so "Approve both" lands as one undoable action rather
    # than N requests that can half-succeed.
    def bulk_update
      ids = Array.wrap(params[:ids]).map(&:to_i)
      status_id = params[:status_id]
      return head(422) if ids.empty? || status_id.blank?

      conflicts = season_conflicts.where(id: ids)
      # Any id we can't reach in this season fails the whole batch, rather than
      # silently deciding a subset.
      return head(404) unless conflicts.count == ids.uniq.count

      apply_bulk(conflicts, status_id)
    end

    private

    def calendar_event(conflict)
      {
        id: conflict.id,
        title: conflict.user.full_name,
        ensemble: conflict.user.ensemble_for(season_id),
        section: conflict.user.section_for(season_id),
        start: conflict.start_date,
        end: conflict.end_date,
        reason: conflict.reason,
        status: { id: conflict.status.id, name: conflict.status.name },
        created_at: conflict.created_at
      }
    end

    def apply_bulk(conflicts, status_id)
      updated = []
      Conflict.transaction do
        conflicts.each do |conflict|
          raise ActiveRecord::Rollback unless conflict.update(status_id: status_id)

          updated << conflict
        end
        raise ActiveRecord::Rollback unless updated.size == conflicts.size
      end

      return head(422) unless updated.size == conflicts.size

      updated.each { |conflict| ActivityLogger.log_conflict(conflict, current_user) }
      render(json: { message: "#{updated.size} #{'conflict'.pluralize(updated.size)} updated" })
    end

    def season_conflicts
      Conflict.for_season(season_id)
    end

    def season_id
      current_season['id']
    end

    def base_scope
      season_conflicts
        .includes(:conflict_status, user: :seasons_users)
        .order(:start_date)
    end

    def filtered_conflicts
      scope = base_scope
      scope = apply_range(scope)
      scope = apply_when(scope)
      scope = apply_status(scope)
      apply_ensemble(scope)
    end

    # A conflict belongs in a window when it overlaps it, not when it sits
    # strictly inside it — a conflict spanning the whole visible month used to
    # disappear from that month.
    def apply_range(scope)
      scope = scope.where(end_date: range_start..) if range_start
      scope = scope.where(start_date: ..range_end) if range_end
      scope
    end

    def apply_when(scope)
      case params[:when]
      when 'upcoming' then scope.where(end_date: Time.current..)
      when 'past' then scope.where(end_date: ...Time.current)
      else scope
      end
    end

    def apply_status(scope)
      status = params[:status]
      return scope unless STATUS_SCOPES.include?(status)

      scope.joins(:conflict_status).where(conflict_statuses: { name: status })
    end

    # Ensemble lives on seasons_users, so it has to be filtered per season.
    def apply_ensemble(scope)
      ensemble = params[:ensemble]
      return scope if ensemble.blank? || ensemble == 'All'

      ids = User.joins(:seasons_users)
                .where(seasons_users: { season_id: season_id, ensemble: ensemble })
                .select(:id)
      scope.where(user_id: ids)
    end

    def status_counts
      counts = base_scope.joins(:conflict_status).group('conflict_statuses.name').count
      STATUS_SCOPES.index_with { |name| counts.fetch(name, 0) }.merge('All' => counts.values.sum)
    end

    def range_start
      parse_time(params[:start])
    end

    def range_end
      parse_time(params[:end])
    end

    # An unparseable date is ignored rather than 500ing or silently swallowing
    # the whole filter.
    def parse_time(value)
      return nil if value.blank?

      Time.zone.parse(value.to_s)
    rescue ArgumentError
      nil
    end

    def conflict_params
      params
        .require(:conflict)
        .permit(:user_id, :status_id, :start_date, :end_date, :reason)
        .merge(season_id: season_id)
    end
  end
end
