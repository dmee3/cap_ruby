class Create9vTable < ActiveRecord::Migration[5.2]
  def change
    create_table :nine_volts do |t|
      t.belongs_to :season, index: true
      t.belongs_to :user, index: true
      t.boolean :turned_in
    end
  end
end
