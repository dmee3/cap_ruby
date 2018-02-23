class CreateBotSayings < ActiveRecord::Migration[5.1]
  def change
    create_table :bot_sayings do |t|
      t.string :saying
      t.timestamps
    end
  end
end
