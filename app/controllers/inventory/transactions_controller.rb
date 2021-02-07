module Inventory
  class TransactionsController < ApplicationController
    before_action :logout_if_unauthorized

    def create
      if Inventory::Transaction.create(transaction_params)
        render '/inventory/index'
      else
        flash[:alert] = 'fuck'
        render '/inventory/index'
      end
    end

    private

    def transaction_params
      params.require(:transaction).permit(items: [])
    end
  end
end
