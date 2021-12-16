class CreateEvents < ActiveRecord::Migration[6.1]
  def change
    create_table :events do |t|
      t.references :season
      t.string :name
      t.datetime :start_date
      t.datetime :end_date
    end
  end
end
