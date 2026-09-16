# frozen_string_literal: true

module Inventory
  class CategoriesController < InventoryController
    before_action :set_category, only: %i[destroy]

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
        flash.now[:error] = @category.errors.full_messages.to_sentence
        render :new
      end
    end

    # Only when empty, so nobody wipes a shelf of gear with one tap. The FK from
    # inventory_items enforces this at the database too; the check is here to
    # give a sentence rather than a 500.
    def destroy
      count = @category.items.count
      if count.positive?
        flash[:error] = "Move or delete its #{count} #{'item'.pluralize(count)} first."
      else
        @category.destroy
        flash[:success] = "Deleted #{@category.name}"
      end
      redirect_to inventory_categories_path
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
