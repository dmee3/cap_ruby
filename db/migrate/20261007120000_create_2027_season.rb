# frozen_string_literal: true

# Production already has a 2027 season with members, and seasons.year isn't
# unique, so this only creates one where it's missing (a fresh dev or staging
# database) rather than adding a second 2027.
class Create2027Season < ActiveRecord::Migration[7.2]
  YEAR = '2027'

  def up
    return if select_value("SELECT 1 FROM seasons WHERE year = #{quote(YEAR)}")

    execute(<<~SQL.squish)
      INSERT INTO seasons (year, conflict_submission_open, created_at, updated_at)
      VALUES (#{quote(YEAR)}, #{quote(false)}, #{quote(Time.current)}, #{quote(Time.current)})
    SQL
  end

  # Only a 2027 season nothing hangs off is removed: rolling back must never take
  # a real season's members, schedules or defaults with it.
  def down
    execute(<<~SQL.squish)
      DELETE FROM seasons
      WHERE year = #{quote(YEAR)}
        AND NOT EXISTS (SELECT 1 FROM seasons_users WHERE seasons_users.season_id = seasons.id)
        AND NOT EXISTS (SELECT 1 FROM payment_schedules WHERE payment_schedules.season_id = seasons.id)
        AND NOT EXISTS (SELECT 1 FROM default_schedule_entries WHERE default_schedule_entries.season_id = seasons.id)
    SQL
  end

  private

  def quote(value)
    connection.quote(value)
  end
end
