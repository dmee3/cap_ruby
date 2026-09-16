# frozen_string_literal: true

module Inventory
  class ItemsController < InventoryController
    before_action :set_category
    before_action :set_item, only: %i[show destroy]

    def show
      @history = ItemHistoryPresenter.call(
        item: @item,
        manage_alerts: %w[admin coordinator].include?(current_user_role)
      )
    end

    def new
      @item = Item.new
    end

    def create
      @item = Inventory::Item.new(item_params)
      if @item.save
        log_first_count
        flash[:success] = "Created #{@item.name} item"
        redirect_to inventory_categories_path
      else
        flash.now[:error] = @item.errors.full_messages.to_sentence
        render :new
      end
    end

    def destroy
      name = @item.name
      @item.destroy
      flash[:success] = "Deleted #{name}. Its history is kept."
      redirect_to inventory_categories_path
    end

    private

    # The opening balance is a change like any other, so the history trail's
    # first row isn't a number that appears from nowhere.
    def log_first_count
      Inventory::Transaction.create!(
        change: @item.quantity,
        previous_quantity: 0,
        performed_on: Date.today,
        inventory_item_id: @item.id,
        user_id: current_user.id
      )
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
