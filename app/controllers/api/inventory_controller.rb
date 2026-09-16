# frozen_string_literal: true

module Api
  # The JSON side of inventory had no authorization at all: ApiController only
  # supplies `respond_to :json`, so until this existed any signed-in user —
  # including a member without inventory_access, who is redirected away from
  # every /inventory screen — could PUT a quantity and write a transaction
  # under their own name. The HTML side has always been guarded by
  # InventoryController; this mirrors its rule.
  class InventoryController < ApiController
    before_action :authenticate_user!
    before_action :redirect_if_no_inventory_access

    private

    def redirect_if_no_inventory_access
      return if %w[admin coordinator].include?(current_user_role)
      return if current_user.quartermaster?

      head :unauthorized
    end
  end
end
