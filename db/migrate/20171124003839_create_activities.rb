# frozen_string_literal: true

class CreateActivities < ActiveRecord::Migration[5.1]
  def change
    create_table :activities do |t|
      t.belongs_to :user
      t.string :description
      t.timestamps
    end
  end
end
