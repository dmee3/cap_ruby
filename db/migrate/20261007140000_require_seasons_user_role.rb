# frozen_string_literal: true

# A season membership with no role can't be switched to or routed to a
# dashboard, so the database now refuses one.
#
# Rows that already lack a role stop the migration rather than being given one:
# whether each was a member, staff or a mistake is a decision for a person.
class RequireSeasonsUserRole < ActiveRecord::Migration[7.2]
  def up
    blank = select_value("SELECT COUNT(*) FROM seasons_users WHERE role IS NULL OR role = ''").to_i
    if blank.positive?
      raise "#{blank} seasons_users #{blank == 1 ? 'row has' : 'rows have'} no role. Give each a role or " \
            "delete it, then migrate again. SeasonsUser.where(role: [nil, '']) lists them."
    end

    change_column_null :seasons_users, :role, false
  end

  def down
    change_column_null :seasons_users, :role, true
  end
end
