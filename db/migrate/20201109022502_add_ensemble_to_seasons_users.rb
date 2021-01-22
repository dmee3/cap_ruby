class AddEnsembleToSeasonsUsers < ActiveRecord::Migration[6.0]
  def change
    add_column :seasons_users, :ensemble, :string
  end
end
