# frozen_string_literal: true

module Coordinators
  class ConflictsController < CoordinatorsController
    def index; end

    def new
      @conflict = Conflict.new
      @members = User.members_for_season(current_season['id']).order(:first_name)
      render('coordinators/conflicts/new')
    end

    def create
      @conflict = Conflict.new(conflict_params)
      @conflict.skip_future_date_validation = true
      if @conflict.save
        flash[:success] = 'Conflict created.'
        ActivityLogger.log_conflict(@conflict, current_user)
        redirect_to(root_url)
      else
        Rollbar.info('Conflict could not be created.', errors: @conflict.errors.full_messages)
        flash.now[:error] = @conflict.errors.full_messages.to_sentence
        @members = User.members_for_season(current_season['id']).order(:first_name)
        render('coordinators/conflicts/new')
      end
    end

    def edit
      @conflict = Conflict.find(params[:id])
      @members = User.members_for_season(current_season['id']).order(:first_name)
      render('coordinators/conflicts/edit')
    end

    def update
      @conflict = Conflict.find(params[:id])
      if @conflict.update(conflict_params.reject { |_k, v| v.blank? })
        ActivityLogger.log_conflict(@conflict, current_user)
        respond_to do |format|
          format.html do
            flash[:success] = "Conflict for #{@conflict.user.full_name} updated"
            redirect_to(coordinators_conflicts_path)
          end
          format.json do
            render(json: { message: "Conflict for #{@conflict.user.full_name} updated" })
          end
        end
      else
        Rollbar.info('Conflict could not be updated.', errors: @conflict.errors.full_messages)
        respond_to do |format|
          format.html do
            flash[:error] = 'Conflict could not be updated.'
            redirect_to(coordinators_conflicts_path)
          end
          format.json { head(422) }
        end
      end
    end

    private

    def conflict_params
      params
        .require(:conflict)
        .permit(:user_id, :status_id, :start_date, :end_date, :reason)
        .merge(season_id: current_season['id'])
    end
  end
end
