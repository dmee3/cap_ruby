# frozen_string_literal: true

# Tells a member their conflict was approved or denied, once the decision has
# settled.
#
# Every save that leaves a decision unannounced schedules one of these, and
# each carries the updated_at of the save that scheduled it. Only the job for
# the latest save acts, and it reads the status at run time rather than
# trusting what it was handed. Undo, deciding twice, or closing the tab mid
# undo window therefore all end in one email about where the conflict actually
# landed, or none if it landed back where the member already knew.
class ConflictDecisionEmailJob < ApplicationJob
  queue_as :mailers

  DELAY = 2.minutes

  def self.schedule(conflict)
    set(wait: DELAY).perform_later(conflict.id, version_of(conflict))
  end

  def self.version_of(conflict)
    conflict.updated_at.utc.iso8601(6)
  end

  def perform(conflict_id, version)
    conflict = Conflict.find_by(id: conflict_id)
    return unless conflict
    return unless self.class.version_of(conflict) == version
    return unless conflict.decision_unannounced?

    EmailService.send_conflict_decision_email(conflict)
    # update_column: recording the email is not an edit, and must not schedule
    # another job or move the version a pending one is waiting on.
    conflict.update_column(:notified_status_id, conflict.status_id)
  end
end
