module Inventory
  class CategoriesController < ApplicationController
    before_action :logout_if_unauthorized
    before_action :redirect_if_no_inventory_access
    before_action :set_category, only: %i[show edit update]

    def index
      @categories = Inventory::Category.all
    end

    def show; end

    def new
      @category = Category.new
    end

    def create
      @category = Inventory::Category.new(category_params)
      if @category.save
        flash[:success] = "Created #{@category.name} category"
        redirect_to @category
      else
        flash.now[:error] = @category.errors.full_messages
        render :new
      end
    end

    def edit; end

    def update
      if @category.update(category_params)
        flash[:success] = "Updated #{@category.name} category"
        redirect_to @category
      else
        flash.now[:error] = @category.errors.full_messages
        render :edit
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
