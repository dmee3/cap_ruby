class ConflictsController < ApplicationController
  before_action :authorized?
  before_action -> { redirect_if_not('admin') }, only: %i[edit update]

  def index
    if current_user.is?(:admin)
      admin_index
    elsif current_user.is?(:staff)
      staff_index
    elsif current_user.is?(:member)
      member_index
    else
      redirect_to(root_url)
    end
  end

  def new
    @conflict = Conflict.new
    if current_user.is?('admin')
      @members = User.for_season(current_season['id']).with_role(:member).order(:first_name)
      render :admin_new
    else
      render :member_new
    end
  end

  def create
    current_user.is?(:admin) ? create_admin_conflict : create_member_conflict
  end

  def edit
    @conflict = Conflict.find(params[:id])
    @members = User.for_season(current_season['id']).with_role(:member).order(:first_name)
    render :admin_edit
  end

  def update
    @conflict = Conflict.find(params[:id])
    if @conflict.update(admin_conflict_params.reject { |_k, v| v.blank? })
      ActivityLogger.log_conflict(@conflict, current_user)
      flash[:success] = 'Conflict updated.'
    else
      Rollbar.info('Conflict could not be updated.', errors: @conflict.errors.full_messages)
      flash[:error] = 'Unable to update conflict.'
    end

    redirect_to(conflicts_path)
  end

  private

  def admin_index
    @pending = Conflict.pending_conflicts(current_season['id'])
    @conflicts_by_start_date = Conflict.future_conflicts_by_start_date(current_season['id'])
    @old_conflicts_by_start_date = Conflict.past_conflicts_by_start_date(current_season['id'])
    render :admin_index
  end

  def staff_index
    @conflicts_by_start_date = Conflict.future_conflicts_by_start_date(current_season['id'])
    render :staff_index
  end

  def member_index
    @conflicts_by_start_date = Conflict.future_conflicts_by_start_date(
      current_season['id'],
      current_user.id
    )
    render :member_index
  end

  def create_admin_conflict
    @conflict = Conflict.new(admin_conflict_params)
    if @conflict.save
      flash[:success] = 'Conflict created.'
      ActivityLogger.log_conflict(@conflict, current_user)
      redirect_to(root_url)
    else
      Rollbar.info('Conflict could not be created.', errors: @conflict.errors.full_messages)
      flash.now[:error] = @conflict.errors.full_messages.to_sentence
      @members = User.for_season(current_season['id']).with_role(:member).order(:first_name)
      render :admin_new
    end
  end

  def create_member_conflict
    @conflict = Conflict.new(member_conflict_params)
    if @conflict.save
      flash[:success] = 'Conflict submitted for review.'
      ActivityLogger.log_conflict(@conflict, current_user)
      redirect_to(root_url)
    else
      Rollbar.info('Conflict could not be submitted.', errors: @conflict.errors.full_messages)
      flash[:error] = 'Conflict could not be submitted.  Please contact a director for help.'
      redirect_to(new_conflict_url)
    end
  end

  def admin_conflict_params
    params.require(:conflict)
          .permit(:user_id, :status_id, :start_date, :end_date, :reason)
          .merge(season_id: current_season['id'])
  end

  def member_conflict_params
    params.require(:conflict)
          .permit(:start_date, :end_date, :reason)
          .merge(
            conflict_status: ConflictStatus.find_by_name('Pending'),
            season_id: current_season['id'],
            user_id: current_user.id
          )
  end
end
