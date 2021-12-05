module Api
  module Inventory
    class ItemsController < ApiController
      def update
        @item = ::Inventory::Item.find(params[:id])
        if update_item
          render json: @item
        else
          head 422
        end
      end

      private

      def update_item
        ActiveRecord::Base.transaction do
          old_quantity = @item.quantity
          @item.update(item_params)
          if @item.quantity != old_quantity
            ::Inventory::Transaction.create(
              change: @item.quantity - old_quantity,
              performed_on: Date.today,
              previous_quantity: old_quantity,
              inventory_item_id: @item.id,
              user_id: current_user.id
            )
            run_emails
          end
        end
        true
      rescue StandardError => e
        Rollbar.error(e)
        false
      end

      def run_emails
        rules = ::Inventory::EmailRule.where(inventory_item_id: @item.id)
        rules.each { |rule| rule.notify_if_applicable(@item.quantity) }
      end

      def item_params
        params.require(:item).permit(:name, :quantity)
      end
    end
  end
end