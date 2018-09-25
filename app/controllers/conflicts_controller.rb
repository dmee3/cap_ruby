class ConflictsController < ApplicationController
  before_action :authorized?
  before_action -> { redirect_if_not 'admin' }, only: %i[edit update]

  def index
    if is? 'admin'
      admin_index
    elsif is? 'staff'
      staff_index
    elsif is? 'member'
      member_index
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
      render :member_new_disabled
    end
  end

  def create
    if is? 'admin'
      create_admin_conflict
    else
      create_member_conflict
    end
  end

  def edit
    @conflict = Conflict.find params[:id]
    @members = User.where(role: Role.find_by_name('member')).order :first_name
    @statuses = ConflictStatus.all.order :name
    render :admin_edit
  end

  def update
    @conflict = Conflict.find params[:id]
    if @conflict.update(admin_conflict_params.reject { |_k, v| v.blank? })
      log_conflict
      flash[:success] = 'Conflict updated.'
    else
      Rollbar.info('Conflict could not be updated.', errors: @conflict.errors.full_messages)
      flash[:error] = 'Unable to update conflict.'
    end

    redirect_to conflicts_path
  end

  private

  def admin_index
    @conflicts_by_start_date = Conflict.where('end_date > ?', Date.yesterday)
                                       .where.not(conflict_status: ConflictStatus.find_by_name('Pending'))
                                       .order(:start_date)
                                       .group_by { |c| c.start_date.to_date }
    @pending = Conflict.where(conflict_status: ConflictStatus.find_by_name('Pending'))
                       .order :start_date
    render :admin_index
  end

  def staff_index
    @conflicts_by_start_date = Conflict.where('end_date > ?', Date.yesterday)
                                       .order(:start_date)
                                       .group_by { |c| c.start_date.to_date }
    render :staff_index
  end

  def member_index
    @conflicts_by_start_date = current_user.conflicts
                                           .order(:start_date)
                                           .group_by { |c| c.start_date.to_date }
    render :member_index
  end

  def create_admin_conflict
    @conflict = Conflict.new admin_conflict_params
    if @conflict.save
      flash[:success] = 'Conflict created.'
      log_conflict
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
      log_conflict
      redirect_to root_url
    else
      Rollbar.info('Conflict could not be submitted.', errors: @conflict.errors.full_messages)
      flash[:error] = 'Conflict could not be submitted.  Please contact a director for help.'
      redirect_to new_conflict_url
    end
  end

  def log_conflict
    return unless @conflict
    start = @conflict.start_date.strftime('%a, %-m/%-d %I:%M %p')
    status = @conflict.status.name.downcase
    log_activity(
      user_id: @conflict.user_id,
      description: "Conflict for #{start} marked #{status}",
      activity_date: Date.today,
      created_by_id: current_user.id,
      activity_type: 'conflict'
    )
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
