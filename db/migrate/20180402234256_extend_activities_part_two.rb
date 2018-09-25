class ExtendActivitiesPartTwo < ActiveRecord::Migration[5.1]
  def change
    change_table :activities do |t|
      t.string :activity_type
    end
  end
end
