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

    def notify_if_applicable(qty)
      notify if applies_to?(qty)
    end

    # The same question without the side effect: the stock list has to show
    # which items are under their alert, and asking by calling the notifying
    # version would email everyone on page load.
    def applies_to?(qty)
      return false if qty.nil? || threshold.nil?

      case operator.to_s
      when 'eq' then qty == threshold
      when 'lt' then qty < threshold
      when 'lt_eq' then qty <= threshold
      when 'gt' then qty > threshold
      when 'gt_eq' then qty >= threshold
      else false
      end
    end

    def notify
      InventoryMailer.with(
        user_id: mail_to_user_id,
        item_name: inventory_item.name,
        rule_id: id
      ).inventory_email.deliver_later
    end
  end
end
