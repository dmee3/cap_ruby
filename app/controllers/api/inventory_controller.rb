# frozen_string_literal: true

module Api
  # ApiController supplies only `respond_to :json`, so each namespace brings its
  # own guard. This mirrors InventoryController's rule, which is what gates the
  # HTML screens these endpoints back.
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
