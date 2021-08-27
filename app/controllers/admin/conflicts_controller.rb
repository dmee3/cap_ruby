module Admin
  class ConflictsController < AdminController
    def index; end

    def new
      @conflict = Conflict.new
      @members = User.for_season(current_season['id']).with_role(:member).order(:first_name)
      render('admin/conflicts/new')
    end

    def create
      @conflict = Conflict.new(conflict_params)
      if @conflict.save
        flash[:success] = 'Conflict created.'
        ActivityLogger.log_conflict(@conflict, current_user)
        redirect_to(root_url)
      else
        Rollbar.info('Conflict could not be created.', errors: @conflict.errors.full_messages)
        flash.now[:error] = @conflict.errors.full_messages.to_sentence
        @members = User.for_season(current_season['id']).with_role(:member).order(:first_name)
        render('admin/conflicts/new')
      end
    end

    def edit
      @conflict = Conflict.find(params[:id])
      @members = User.for_season(current_season['id']).with_role(:member).order(:first_name)
      render('admin/conflicts/edit')
    end

    def update
      @conflict = Conflict.find(params[:id])
      if @conflict.update(conflict_params.reject { |_k, v| v.blank? })
        ActivityLogger.log_conflict(@conflict, current_user)
        respond_to do |format|
          format.html do
            flash[:success] = "Conflict for #{@conflict.user.full_name} updated"
            redirect_to(admin_conflicts_path)
          end
          format.json { render(json: { message: "Conflict for #{@conflict.user.full_name} updated" }) }
        end
      else
        Rollbar.info('Conflict could not be updated.', errors: @conflict.errors.full_messages)
        respond_to do |format|
          format.html do
            flash[:error] = 'Conflict could not be updated.'
            redirect_to(admin_conflicts_path)
          end
          format.json { head(422) }
        end
      end
    end

    def upcoming_conflicts
      begin
        start_date = Date.parse(params[:start_date])
        end_date = Date.parse(params[:end_date])
      rescue TypeError, ArgumentError
        start_date = Date.today
        end_date = Date.today + 2.weeks
      end

      render(json: {
        conflicts: DashboardUtilities.upcoming_conflicts(start_date, end_date, current_season['id'])
      })
    end

    def statuses
      render json: { statuses: ConflictStatus.all }
    end

    private

    def future_conflicts
      Conflict
        .includes(:conflict_status, :user)
        .future_conflicts
        .for_season(current_season['id'])
        .order(:start_date)
    end

    def past_conflicts
      Conflict
        .includes(:conflict_status, :user)
        .past_conflicts
        .for_season(current_season['id'])
        .order(:start_date)
    end

    def pending_conflicts
      Conflict
        .includes(:conflict_status, :user)
        .for_season(current_season['id'])
        .with_status(ConflictStatus.find_by_name('Pending'))
        .order(:start_date)
    end

    def all_season_conflicts
      Conflict
        .includes(:conflict_status, :user)
        .for_season(current_season['id'])
        .order(:start_date)
    end

    def conflict_params
      params
        .require(:conflict)
        .permit(:user_id, :status_id, :start_date, :end_date, :reason)
        .merge(season_id: current_season['id'])
    end
  end
end
