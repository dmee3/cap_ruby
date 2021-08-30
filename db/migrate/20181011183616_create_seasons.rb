# frozen_string_literal: true

class CreateSeasons < ActiveRecord::Migration[5.1]
  def change
    create_table :seasons do |t|
      t.string :year
      t.timestamps
    end

    create_table :seasons_users do |t|
      t.belongs_to :season, index: true
      t.belongs_to :user, index: true
    end

    change_table :conflicts do |t|
      t.belongs_to :season
    end

    change_table :payments do |t|
      t.belongs_to :season
    end

    change_table :payment_schedules do |t|
      t.belongs_to :season
    end
  end
end
