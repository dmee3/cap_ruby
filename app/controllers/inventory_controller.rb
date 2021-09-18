class InventoryController < ApplicationController
  before_action :authenticate_user!
  before_action :redirect_if_no_inventory_access

  layout 'inventory'

  def redirect_if_no_inventory_access
    redirect_to(root_url) unless current_user_role == 'admin' || current_user.quartermaster?
  end
end