class CreateBotPointEntries < ActiveRecord::Migration[5.1]
  def change
    create_table :bot_point_entries do |t|
      t.belongs_to :bot_point
      t.string :reason
      t.integer :score, default: 0
      t.timestamps
    end
  end
end
