# frozen_string_literal: true

# The coordinator/admin conflict screens, shared by both namespaces (Flow 5).
#
# Admin::ConflictsController and Coordinators::ConflictsController were
# identical apart from their namespace and redirect target, down to
# byte-identical _form partials. They are now thin shells over this concern:
# both keep their own URLs, because redirect_if_not is an exact role match and
# each role can only reach its own.
module ConflictTriage
  extend ActiveSupport::Concern

  included do
    helper_method :conflict_base_path
  end

  def index
    @ensembles = SeasonsUser.where(season_id: current_season['id'])
                            .where.not(ensemble: [nil, ''])
                            .distinct
                            .pluck(:ensemble)
                            .sort
    render('conflicts/index')
  end

  def new
    @conflict = Conflict.new
    load_form_collections
    render('conflicts/new')
  end

  def create
    @conflict = Conflict.new(conflict_params)
    # Coordinators file conflicts on someone's behalf after the fact, so a past
    # date is expected here in a way it never is on the member form.
    @conflict.skip_future_date_validation = true

    if @conflict.save
      flash[:success] = 'Conflict created.'
      ActivityLogger.log_conflict(@conflict, current_user)
      # Back to the queue it was opened from — this used to land on the
      # dashboard, which lost the coordinator's place.
      redirect_to(conflict_base_path)
    else
      Rollbar.info('Conflict could not be created.', errors: @conflict.errors.full_messages)
      load_form_collections
      render('conflicts/new')
    end
  end

  def edit
    @conflict = season_conflicts.find(params[:id])
    load_form_collections
    render('conflicts/edit')
  end

  def update
    @conflict = season_conflicts.find(params[:id])
    @conflict.skip_future_date_validation = true

    if @conflict.update(conflict_params.reject { |_k, v| v.blank? })
      ActivityLogger.log_conflict(@conflict, current_user)
      respond_to do |format|
        format.html do
          flash[:success] = "Conflict for #{@conflict.user.full_name} updated"
          redirect_to(conflict_base_path)
        end
        format.json { render(json: { message: "Conflict for #{@conflict.user.full_name} updated" }) }
      end
    else
      Rollbar.info('Conflict could not be updated.', errors: @conflict.errors.full_messages)
      respond_to do |format|
        format.html do
          load_form_collections
          render('conflicts/edit')
        end
        format.json { head(422) }
      end
    end
  end

  private

  def season_conflicts
    Conflict.for_season(current_season['id'])
  end

  def load_form_collections
    @members = User.members_for_season(current_season['id']).order(:first_name)
    @statuses = ConflictStatus.all.order(:name)
  end

  # The form posts a native date and time input per boundary, the same shape
  # the member form uses, and they are recombined here.
  def conflict_params
    permitted = params.require(:conflict).permit(
      :user_id, :status_id, :reason,
      :start_date_date, :start_date_time, :end_date_date, :end_date_time,
      :start_date, :end_date
    )

    {
      user_id: permitted[:user_id],
      status_id: permitted[:status_id],
      reason: permitted[:reason],
      start_date: boundary(permitted, :start_date),
      end_date: boundary(permitted, :end_date),
      season_id: current_season['id']
    }.compact
  end

  def boundary(permitted, field)
    combined = combine_date_time(permitted[:"#{field}_date"], permitted[:"#{field}_time"])
    combined || permitted[field]
  end

  def combine_date_time(date_str, time_str)
    return nil if date_str.blank? || time_str.blank?

    Time.zone.parse("#{date_str} #{time_str}")
  rescue ArgumentError
    nil
  end
end
