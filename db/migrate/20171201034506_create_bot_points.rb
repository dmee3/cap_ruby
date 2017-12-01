class CreateBotPoints < ActiveRecord::Migration[5.1]
  def change
    create_table :bot_points do |t|
      t.string :name
      t.string :room
      t.timestamps
    end
  end
end
