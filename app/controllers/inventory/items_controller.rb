# frozen_string_literal: true

module Inventory
  class ItemsController < InventoryController
    before_action :set_category
    before_action :set_item, only: %i[show]

    def show; end

    def new
      @item = Item.new
    end

    def create
      @item = Inventory::Item.new(item_params)
      if @item.save
        flash[:success] = "Created #{@item.name} item"
        redirect_to inventory_categories_path
      else
        flash.now[:error] = @item.errors.full_messages
        render :new
      end
    end

    private

    def set_category
      @category = Inventory::Category.find(params[:category_id])
    end

    def set_item
      @item = Inventory::Item.find(params[:id])
    end

    def item_params
      params
        .require(:inventory_item)
        .permit(:name, :quantity)
        .merge(inventory_category_id: @category.id)
    end
  end
end
