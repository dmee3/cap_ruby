class SimplifyBotPoints < ActiveRecord::Migration[5.1]
  def change
    BotPointEntry.delete_all
    BotPoint.delete_all

    drop_table :bot_point_entries

    remove_column :bot_points, :room
    add_column :bot_points, :score, :integer, default: 0
    add_column :bot_points, :reason, :string
  end
end
