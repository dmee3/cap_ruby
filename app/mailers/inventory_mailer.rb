# frozen_string_literal: true

class InventoryMailer < ApplicationMailer
  def inventory_email
    @user = User.find(params[:user_id])
    @item_name = params[:item_name]
    @rule = Inventory::EmailRule.find(params[:rule_id])

    mail(
      to: @user.email,
      subject: 'Cap City - Inventory Rule Triggered'
    )
  end
end
