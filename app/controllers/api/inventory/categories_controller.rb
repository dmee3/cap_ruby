# frozen_string_literal: true

module Api
  module Inventory
    class CategoriesController < ApiController
      def index
        @categories = ::Inventory::Category.includes(:items).all
        render json: @categories.to_json(include: :items)
      end

      def update
        @category = ::Inventory::Category.find(params[:id])
        if @category.update(category_params)
          render json: @category
        else
          head 422
        end
      end

      private

      def category_params
        params.require(:category).permit(:name)
      end
    end
  end
end
