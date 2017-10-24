class ConflictsController < ApplicationController
  def index
    if is? 'admin'
      @conflicts = Conflict.all
      render 'admin_index'
    elsif is? 'member'
      @conflicts = Conflict.where user_id: current_user.id
      render 'member_index'
    else
      redirect_to root_url
    end
  end
end
