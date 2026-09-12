# frozen_string_literal: true

module Admin
  # A route and a shell over ConflictTriage — nothing on the triage screens is
  # admin-only. The namespace survives because redirect_if_not is an exact role
  # match, so an admin can only reach /admin/*.
  class ConflictsController < AdminController
    include ConflictTriage

    private

    def conflict_base_path
      admin_conflicts_path
    end
  end
end
