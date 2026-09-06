# frozen_string_literal: true

class AddConflictSubmissionOpenToSeasons < ActiveRecord::Migration[7.2]
  def change
    add_column :seasons, :conflict_submission_open, :boolean, default: false
  end
end
