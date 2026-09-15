# frozen_string_literal: true

# The public fundraiser addresses a performer by an opaque token rather than
# their id or their name: the URL gets forwarded through group texts and social
# posts, so it shouldn't publish a minor's full name, and a sequential id would
# let anyone walk the roster.
class AddPublicTokenToUsers < ActiveRecord::Migration[7.2]
  def up
    add_column :users, :public_token, :string
    add_index :users, :public_token, unique: true

    # Backfill in one pass, matching what `has_secure_token` generates on new
    # records (base58, so no ambiguous 0/O/I/l in a token someone may read off
    # a phone). `User` is paranoid, so go through the table rather than the
    # model's default scope — a soft-deleted performer's old share link should
    # still resolve rather than 404 on a NULL token.
    say_with_time 'backfilling users.public_token' do
      existing = select_values('SELECT public_token FROM users WHERE public_token IS NOT NULL').to_set

      select_values('SELECT id FROM users WHERE public_token IS NULL').each do |id|
        token = nil
        token = SecureRandom.base58(12) while token.nil? || existing.include?(token)
        existing << token
        execute("UPDATE users SET public_token = #{quote(token)} WHERE id = #{quote(id)}")
      end
    end
  end

  def down
    remove_index :users, :public_token
    remove_column :users, :public_token
  end
end
