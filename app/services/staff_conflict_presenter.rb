# frozen_string_literal: true
# typed: true

# Groups upcoming conflicts by date for the staff dashboard (Flow 10).
#
# Wraps ConflictTriagePresenter so a staff row and a coordinator's triage row
# read identically, then drops the two things triage attaches for deciding:
#
#   * `reason`, because staff never decide and a visible reason is the only
#     thing that would make TriageRow render its expander, and
#   * the Activity-derived attribution subline ("you approved it 52 days ago"),
#     which is decision context and costs a query per page load.
#
# Staff are read-only on conflicts — there is no Staff::ConflictsController, and
# approve/deny/edit live with the coordinators.
class StaffConflictPresenter
  extend T::Sig

  class << self
    extend T::Sig

    sig do
      params(conflicts: T::Enumerable[Conflict], season_id: Integer)
        .returns(T::Array[T::Hash[Symbol, T.untyped]])
    end
    def date_groups_for(conflicts, season_id)
      ConflictTriagePresenter.date_groups_for(conflicts, season_id, nil, attribution: false).map do |group|
        group.merge(
          out_count: group[:rows].size,
          rows: group[:rows].map { |row| read_only_row(row) }
        )
      end
    end

    private

    sig { params(row: T::Hash[Symbol, T.untyped]).returns(T::Hash[Symbol, T.untyped]) }
    def read_only_row(row)
      row.except(:reason, :editable, :edit_path)
    end
  end
end
