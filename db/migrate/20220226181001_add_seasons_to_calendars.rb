# frozen_string_literal: true

class AddSeasonsToCalendars < ActiveRecord::Migration[6.1]
  def change
    add_reference :calendar_donations, :season, index: true
    add_foreign_key :calendar_donations, :seasons
  end
end
