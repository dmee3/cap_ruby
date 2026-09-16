# frozen_string_literal: true

module Api
  module Inventory
    class ItemsController < Api::InventoryController
      def update
        @item = ::Inventory::Item.find(params[:id])
        return render_stale if stale_base?

        if update_item
          render json: item_json
        else
          render json: { errors: @item.errors.full_messages }, status: :unprocessable_entity
        end
      rescue StandardError => e
        # Rollbar keeps the genuine exceptions; a validation failure is not one
        # and no longer takes this path.
        Rollbar.error(e)
        render json: { errors: ['Something went wrong saving that count.'] },
               status: :internal_server_error
      end

      def destroy
        @item = ::Inventory::Item.find(params[:id])
        @item.destroy
        head :no_content
      end

      private

      # The stock list computes its own arithmetic (an adjustment is a delta,
      # never an absolute), so it also tells us what it counted from. If the
      # shelf moved underneath it — two quartermasters counting at once — the
      # write is refused rather than silently overwriting the other count.
      def stale_base?
        expected = expected_previous_quantity
        return false if expected.nil?

        expected != @item.quantity
      end

      def expected_previous_quantity
        value = params[:item] && params[:item][:previous_quantity]
        return nil if value.blank?

        Integer(value, exception: false)
      end

      def render_stale
        render json: {
                 errors: ["Someone else counted this. It's #{@item.quantity} now."],
                 current_quantity: @item.quantity
               },
               status: :conflict
      end

      def update_item
        saved = false
        ActiveRecord::Base.transaction do
          old_quantity = @item.quantity
          # The return value used to be discarded and the method returned true
          # unconditionally, so a rejected update answered 200 and still wrote a
          # transaction and fired low-stock emails for a change that never
          # persisted.
          saved = @item.update(item_params)
          raise ActiveRecord::Rollback unless saved

          log_change(old_quantity) if @item.quantity != old_quantity
        end
        saved
      end

      def log_change(old_quantity)
        ::Inventory::Transaction.create!(
          change: @item.quantity - old_quantity,
          performed_on: Date.today,
          previous_quantity: old_quantity,
          inventory_item_id: @item.id,
          user_id: current_user.id
        )
        run_emails
      end

      def run_emails
        rules = ::Inventory::EmailRule.where(inventory_item_id: @item.id)
        rules.each { |rule| rule.notify_if_applicable(@item.quantity) }
      end

      def item_json
        @item.as_json.merge('last_change' => last_change_json)
      end

      def last_change_json
        transaction = @item.transactions.newest_first.first
        return nil if transaction.nil?

        {
          'change' => transaction.change,
          'previous_quantity' => transaction.previous_quantity,
          'performed_on' => transaction.performed_on,
          'user_name' => transaction.user.full_name
        }
      end

      def item_params
        params.require(:item).permit(:name, :quantity)
      end
    end
  end
end
