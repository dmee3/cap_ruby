# frozen_string_literal: true

module Api
  module Inventory
    class CategoriesController < Api::InventoryController
      def index
        render json: ::Inventory::StockListPresenter.call(manage_alerts: manage_alerts?)
      end

      def create
        @category = ::Inventory::Category.new(category_params)
        if @category.save
          render json: { id: @category.id, name: @category.name, item_count: 0, items: [] },
                 status: :created
        else
          render json: { errors: @category.errors.full_messages },
                 status: :unprocessable_entity
        end
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

      # Alerts are the one screen inside a granted feature that a quartermaster
      # member still can't reach, so the list hides the links rather than
      # offering a route to a redirect.
      def manage_alerts?
        %w[admin coordinator].include?(current_user_role)
      end

      # The FK from inventory_items refuses this at the database anyway; the
      # check turns that into a sentence rather than a 500.
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
