module Inventory
  class ItemsController < ApplicationController
    before_action :logout_if_unauthorized
    before_action :set_category
    before_action :set_item, only: %i[edit update show]

    def show; end

    def new
      @item = Item.new
    end

    def create
      @item = Inventory::Item.new(item_params)
      if @item.save
        flash[:success] = "Created #{@item.name} item"
        redirect_to inventory_category_path(@category)
      else
        flash.now[:error] = @item.errors.full_messages
        render :new
      end
    end

    def edit; end

    def update
      if update_item
        flash[:success] = "Updated #{@item.name} item"
        redirect_to inventory_category_path(@category)
      else
        flash.now[:error] = "Unable to update item"
        render :edit
      end
    end

    private

    def update_item
      ActiveRecord::Base.transaction do
        old_quantity = @item.quantity
        @item.update(item_params)
        if @item.quantity != old_quantity
          Inventory::Transaction.create(
            change: @item.quantity - old_quantity,
            performed_on: params[:inventory_item][:performed_on],
            previous_quantity: old_quantity,
            inventory_item_id: @item.id,
            user_id: current_user.id
          )
        end
      end
    end

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
