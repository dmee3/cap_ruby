module Api
  module Inventory
    class ItemsController < ApiController
      def update
        @item = ::Inventory::Item.find(params[:id])
        if @item.update(item_params)
          render json: @item
        else
          head 422
        end
      end

      private

      def item_params
        params.require(:item).permit(:name, :quantity)
      end
    end
  end
end