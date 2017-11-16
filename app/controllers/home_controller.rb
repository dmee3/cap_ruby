class HomeController < ApplicationController
  before_action :authorized?

  def index
    if is? :admin
      admin_index
    elsif is? :staff
      staff_index
    elsif is? :member
      member_index
    else
      Rollbar.warning('User with unknown role accessed home page.')
      logout
    end
  end

  def documents
    document_directory = "#{Rails.root}/public/pdf"
    @documents = Dir.glob("#{document_directory}/**/*")
                    .map { |path| path.split('/').last }
  end

  private

  def admin_index
    @pending_conflicts = Conflict.where(conflict_status: ConflictStatus.find_by_name('Pending'))
                                 .count
    render :admin_index
  end

  def staff_index
    render :staff_index
  end

  def member_index
    @pending_conflicts = Conflict.where(user: current_user)
                                 .where(conflict_status: ConflictStatus.find_by_name('Pending'))
                                 .count
    render :member_index
  end
end
