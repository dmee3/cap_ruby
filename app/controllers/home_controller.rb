class HomeController < ApplicationController
  before_action :authorized?

  def index
    if is? 'admin'
      admin_index
    elsif is? 'staff'
      staff_index
    elsif is? 'member'
      member_index
    else
      # Some sort of HTTP authorization error (403?)
    end
  end

  private

  def admin_index
    render :admin_index
  end

  def staff_index
    render :staff_index
  end

  def member_index
    render :member_index
  end
end
