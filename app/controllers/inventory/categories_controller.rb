# frozen_string_literal: true

module Inventory
  class CategoriesController < InventoryController
    def index
      @categories = Inventory::Category.all
    end

    def new
      @category = Category.new
    end

    def create
      @category = Inventory::Category.new(category_params)
      if @category.save
        flash[:success] = "Created #{@category.name} category"
        redirect_to inventory_categories_path
      else
        flash.now[:error] = @category.errors.full_messages
        render :new
      end
    end

    private

    def set_category
      @category = Inventory::Category.find(params[:id])
    end

    def category_params
      params.require(:inventory_category).permit(:name)
    end
  end
end
