# frozen_string_literal: true

class AddCalendarFundraiserEnabledToSeasons < ActiveRecord::Migration[7.2]
  def change
    add_column :seasons, :calendar_fundraiser_enabled, :boolean, default: false, null: false
  end
end
