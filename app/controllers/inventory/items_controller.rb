module Inventory
  class ItemsController < ApplicationController
    before_action :logout_if_unauthorized

    def create
      if Inventory::Item.create(item_params)
        render '/inventory/index'
      else
        flash[:alert] = 'fuck'
        render '/inventory/index'
      end
    end

    private

    def item_params
      params.require(:item).permit(:name, :quantity, :category_id)
    end
  end
end
