class DeleteNineVolts < ActiveRecord::Migration[6.1]
  def change
    drop_table :nine_volts
  end
end
