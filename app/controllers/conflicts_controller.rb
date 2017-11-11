class ConflictsController < ApplicationController
  before_action :authorized?

  def index
    if is? 'admin'
      @conflicts = Conflict.where('start_date > ?', Date.yesterday).order :start_date
      @pending = Conflict.where(conflict_status: ConflictStatus.find_by_name('Pending'))
      render :admin_index
    elsif is? 'member'
      @conflicts = current_user.conflicts
      render :member_index
    else
      redirect_to root_url
    end
  end

  def new
    @conflict = Conflict.new
    if is? 'admin'
      @members = User.where(role: Role.find_by_name('member')).order :first_name
      @statuses = ConflictStatus.all.order :name
      render :admin_new
    else
      render :member_new
    end
  end

  def create
    if is? 'admin'
      create_admin_conflict
    else
      create_member_conflict
    end
  end

  def update
    @conflict = Conflict.find params[:id]
    if @conflict.update(admin_conflict_params.reject { |_k, v| v.blank? })
      flash[:success] = 'Conflict updated.'
    else
      Rollbar.info('Conflict could not be updated.', errors: @conflict.errors.full_messages)
      flash[:error] = 'Unable to update conflict.'
    end

    redirect_to conflicts_path
  end

  private

  def create_admin_conflict
    @conflict = Conflict.new admin_conflict_params
    if @conflict.save
      flash[:success] = 'Conflict created.'
      redirect_to root_url
    else
      Rollbar.info('Conflict could not be created.', errors: @conflict.errors.full_messages)
      flash.now[:error] = @conflict.errors.full_messages.to_sentence
      @members = User.where(role: Role.find_by_name('member')).order :first_name
      @statuses = ConflictStatus.all.order :name
      render :admin_new
    end
  end

  def create_member_conflict
    @conflict = Conflict.new member_conflict_params
    if @conflict.save
      flash[:success] = 'Conflict submitted for review.'
      redirect_to root_url
    else
      Rollbar.info('Conflict could not be submitted.', errors: @conflict.errors.full_messages)
      flash[:error] = 'Conflict could not be submitted.  Please contact a director for help.'
      redirect_to new_conflict_url
    end
  end

  def admin_conflict_params
    params.require(:conflict).permit(:user_id, :status_id, :start_date, :end_date, :reason)
  end

  def member_conflict_params
    params.require(:conflict)
          .permit(:start_date, :end_date, :reason)
          .merge(user_id: current_user.id, conflict_status: ConflictStatus.find_by_name('Pending'))
  end
end
