# frozen_string_literal: true

module Coordinators
  # The coordinator half of the same screens — see ConflictTriage. Identical
  # behaviour to the admin controller; only the base path differs.
  class ConflictsController < CoordinatorsController
    include ConflictTriage

    private

    def conflict_base_path
      coordinators_conflicts_path
    end
  end
end
