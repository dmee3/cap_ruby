class ExtendActivities < ActiveRecord::Migration[5.1]
  def change
    change_table :activities do |t|
      t.date :activity_date
      t.integer :created_by_id, default: nil
    end

    Activity.all.each do |a|
      a.update_attributes(activity_date: a.created_at.to_date, created_by_id: a.user_id)
    end
  end
end
