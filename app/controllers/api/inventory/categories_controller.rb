# frozen_string_literal: true

module Api
  module Inventory
    class CategoriesController < Api::InventoryController
      def index
        @categories = ::Inventory::Category.includes(:items).all
        render json: @categories.to_json(include: :items)
      end

      def update
        @category = ::Inventory::Category.find(params[:id])
        if @category.update(category_params)
          render json: @category
        else
          render json: { errors: @category.errors.full_messages },
                 status: :unprocessable_entity
        end
      end

      def destroy
        @category = ::Inventory::Category.find(params[:id])
        return render_not_empty if @category.items.any?

        @category.destroy
        head :no_content
      end

      private

      # The FK from inventory_items already refuses this at the database, so the
      # check is about giving the UI a sentence rather than a 500.
      def render_not_empty
        count = @category.items.count
        render json: {
                 errors: ["Move or delete its #{count} #{'item'.pluralize(count)} first."]
               },
               status: :unprocessable_entity
      end

      def category_params
        params.require(:category).permit(:name)
      end
    end
  end
end
