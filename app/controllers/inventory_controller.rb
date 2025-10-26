# frozen_string_literal: true

class InventoryController < ApplicationController
  before_action :authenticate_user!
  before_action :redirect_if_no_inventory_access

  def redirect_if_no_inventory_access
    return if %w[admin coordinator].include?(current_user_role)
    return if current_user.quartermaster?

    redirect_to(root_url)
  end
end
