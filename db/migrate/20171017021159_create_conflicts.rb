# frozen_string_literal: true

class CreateConflicts < ActiveRecord::Migration[5.1]
  def change
    create_table :conflicts do |t|
      t.belongs_to :user

      t.datetime :start_date
      t.datetime :end_date

      t.text :reason

      t.belongs_to :status

      t.timestamps
      t.datetime :deleted_at
    end
  end
end
