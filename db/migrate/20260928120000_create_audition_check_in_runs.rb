# frozen_string_literal: true

# The check-in sync runs in a Sidekiq job, so the page that starts it has to
# find out later how it went. Web and worker dynos share no cache, so the
# outcome lives here.
class CreateAuditionCheckInRuns < ActiveRecord::Migration[7.2]
  def change
    create_table :audition_check_in_runs do |t|
      t.string :status, null: false, default: 'queued'
      t.json :report
      t.text :error
      t.datetime :started_at
      t.datetime :finished_at
      t.timestamps
    end
  end
end
