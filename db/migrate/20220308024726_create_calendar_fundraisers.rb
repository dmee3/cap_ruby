class CreateCalendarFundraisers < ActiveRecord::Migration[6.1]
  def change
    create_table :calendar_fundraisers do |t|
      t.references :user, foreign_key: true
      t.references :season, foreign_key: true

      t.timestamps
    end
  end
end
