# frozen_string_literal: true

# == Schema Information
#
# Table name: inventory_email_rules
#
#  id                :integer          not null, primary key
#  operator          :string
#  threshold         :integer
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  inventory_item_id :integer
#  mail_to_user_id   :integer
#
# Indexes
#
#  index_inventory_email_rules_on_inventory_item_id  (inventory_item_id)
#  index_inventory_email_rules_on_mail_to_user_id    (mail_to_user_id)
#
module Inventory
  class EmailRule < ApplicationRecord
    validates :mail_to_user_id, :inventory_item_id, :threshold, :operator, presence: true

    belongs_to :user, foreign_key: :mail_to_user_id
    belongs_to :inventory_item, class_name: 'Inventory::Item', foreign_key: :inventory_item_id

    # rubocop:disable Metrics/AbcSize, Metrics/CyclomaticComplexity
    def notify_if_applicable(qty)
      case operator.to_sym
      when :eq
        notify if qty == threshold
      when :lt
        notify if qty < threshold
      when :lt_eq
        notify if qty <= threshold
      when :gt
        notify if qty > threshold
      when :gt_eq
        notify if qty >= threshold
      end
    end
    # rubocop:enable Metrics/AbcSize, Metrics/CyclomaticComplexity

    def notify
      InventoryMailer.with(
        user_id: mail_to_user_id,
        item_name: inventory_item.name,
        rule_id: id
      ).inventory_email.deliver_later
    end
  end
end
