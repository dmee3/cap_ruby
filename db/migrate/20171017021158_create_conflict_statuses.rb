class CreateConflictStatuses < ActiveRecord::Migration[5.1]
  def change
    create_table :conflict_statuses do |t|
      t.name
      t.timestamps
    end
  end
end
