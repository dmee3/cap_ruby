class CreateInventoryEmailRules < ActiveRecord::Migration[6.1]
  def change
    create_table :inventory_email_rules do |t|
      t.references :mail_to_user
      t.references :inventory_item
      t.integer :threshold
      t.string :operator
      t.timestamps
    end
  end
end
