# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20180402234256) do

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
    t.index ["status_id"], name: "index_conflicts_on_status_id"
    t.index ["user_id"], name: "index_conflicts_on_user_id"
  end

  create_table "payment_schedule_entries", force: :cascade do |t|
    t.integer "payment_schedule_id"
    t.integer "amount"
    t.date "pay_date"
    t.boolean "already_paid"
    t.index ["payment_schedule_id"], name: "index_payment_schedule_entries_on_payment_schedule_id"
  end

  create_table "payment_schedules", force: :cascade do |t|
    t.integer "user_id"
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
    t.index ["deleted_at"], name: "index_payments_on_deleted_at"
    t.index ["payment_type_id"], name: "index_payments_on_payment_type_id"
    t.index ["user_id"], name: "index_payments_on_user_id"
  end

  create_table "roles", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.string "first_name"
    t.string "last_name"
    t.integer "role_id"
    t.string "email"
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "deleted_at"
    t.string "section"
    t.index ["deleted_at"], name: "index_users_on_deleted_at"
    t.index ["role_id"], name: "index_users_on_role_id"
  end

end
