class ConflictsController < ApplicationController
  def index
    if is? 'admin'
      @conflicts = Conflict.all
    elsif is? 'member'
      @conflicts = Conflict.where user_id: current_user.id
    else
      redirect_to root_url
    end
  end
end
