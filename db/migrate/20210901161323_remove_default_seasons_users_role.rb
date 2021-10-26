class RemoveDefaultSeasonsUsersRole < ActiveRecord::Migration[6.1]
  def change
    change_column_default(:seasons_users, :role, nil)
  end
end
