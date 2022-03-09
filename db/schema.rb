# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2022_03_08_032148) do

  create_table "activities", force: :cascade do |t|
    t.integer "user_id"
    t.string "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date "activity_date"
    t.integer "created_by_id"
    t.string "activity_type"
    t.index ["user_id"], name: "index_activities_on_user_id"
  end

  create_table "bot_points", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "score", default: 0
    t.string "reason"
  end

  create_table "bot_sayings", force: :cascade do |t|
    t.string "saying"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "calendar_donations", force: :cascade do |t|
    t.integer "user_id"
    t.integer "amount"
    t.string "notes"
    t.integer "donation_date"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "donor_name"
    t.integer "season_id"
    t.integer "calendar_fundraiser_id"
    t.index ["calendar_fundraiser_id"], name: "index_calendar_donations_on_calendar_fundraiser_id"
    t.index ["season_id"], name: "index_calendar_donations_on_season_id"
    t.index ["user_id"], name: "index_calendar_donations_on_user_id"
  end

  create_table "calendar_fundraisers", force: :cascade do |t|
    t.integer "user_id"
    t.integer "season_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["season_id"], name: "index_calendar_fundraisers_on_season_id"
    t.index ["user_id"], name: "index_calendar_fundraisers_on_user_id"
  end

  create_table "conflict_statuses", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "conflicts", force: :cascade do |t|
    t.integer "user_id"
    t.datetime "start_date"
    t.datetime "end_date"
    t.text "reason"
    t.integer "status_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "deleted_at"
    t.integer "season_id"
    t.index ["season_id"], name: "index_conflicts_on_season_id"
    t.index ["status_id"], name: "index_conflicts_on_status_id"
    t.index ["user_id"], name: "index_conflicts_on_user_id"
  end

  create_table "events", force: :cascade do |t|
    t.integer "season_id"
    t.string "name"
    t.datetime "start_date"
    t.datetime "end_date"
    t.index ["season_id"], name: "index_events_on_season_id"
  end

  create_table "inventory_categories", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "inventory_email_rules", force: :cascade do |t|
    t.integer "mail_to_user_id"
    t.integer "inventory_item_id"
    t.integer "threshold"
    t.string "operator"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["inventory_item_id"], name: "index_inventory_email_rules_on_inventory_item_id"
    t.index ["mail_to_user_id"], name: "index_inventory_email_rules_on_mail_to_user_id"
  end

  create_table "inventory_items", force: :cascade do |t|
    t.string "name"
    t.integer "quantity"
    t.integer "inventory_category_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["inventory_category_id"], name: "index_inventory_items_on_inventory_category_id"
  end

  create_table "inventory_transactions", force: :cascade do |t|
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.bigint "user_id"
    t.date "performed_on"
    t.bigint "inventory_item_id"
    t.integer "previous_quantity"
    t.integer "change"
    t.index ["inventory_item_id"], name: "index_inventory_transactions_on_inventory_item_id"
    t.index ["user_id"], name: "index_inventory_transactions_on_user_id"
  end

  create_table "payment_intents", force: :cascade do |t|
    t.integer "amount"
    t.string "stripe_pi_id"
    t.integer "user_id"
    t.integer "season_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["season_id"], name: "index_payment_intents_on_season_id"
    t.index ["user_id"], name: "index_payment_intents_on_user_id"
  end

  create_table "payment_schedule_entries", force: :cascade do |t|
    t.integer "payment_schedule_id"
    t.integer "amount"
    t.date "pay_date"
    t.index ["payment_schedule_id"], name: "index_payment_schedule_entries_on_payment_schedule_id"
  end

  create_table "payment_schedules", force: :cascade do |t|
    t.integer "user_id"
    t.integer "season_id"
    t.index ["season_id"], name: "index_payment_schedules_on_season_id"
    t.index ["user_id"], name: "index_payment_schedules_on_user_id"
  end

  create_table "payment_types", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "payments", force: :cascade do |t|
    t.integer "user_id"
    t.integer "payment_type_id"
    t.integer "amount"
    t.date "date_paid"
    t.string "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "deleted_at"
    t.integer "season_id"
    t.index ["deleted_at"], name: "index_payments_on_deleted_at"
    t.index ["payment_type_id"], name: "index_payments_on_payment_type_id"
    t.index ["season_id"], name: "index_payments_on_season_id"
    t.index ["user_id"], name: "index_payments_on_user_id"
  end

  create_table "seasons", force: :cascade do |t|
    t.string "year"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "seasons_users", force: :cascade do |t|
    t.integer "season_id"
    t.integer "user_id"
    t.string "section"
    t.string "ensemble"
    t.string "role"
    t.index ["season_id"], name: "index_seasons_users_on_season_id"
    t.index ["user_id"], name: "index_seasons_users_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "first_name"
    t.string "last_name"
    t.string "email", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "deleted_at"
    t.string "username"
    t.string "phone"
    t.boolean "inventory_access", default: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.index ["deleted_at"], name: "index_users_on_deleted_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "calendar_donations", "calendar_fundraisers"
  add_foreign_key "calendar_donations", "seasons"
  add_foreign_key "calendar_fundraisers", "seasons"
  add_foreign_key "calendar_fundraisers", "users"
  add_foreign_key "inventory_items", "inventory_categories"
end
