class HomeController < ApplicationController
  before_action :authorized?

  def index
    if current_user.is?(:admin)
      admin_index
    elsif current_user.is?(:staff)
      staff_index
    elsif current_user.is?(:member)
      member_index
    else
      Rollbar.warning('User with unknown role accessed home page.')
      logout
    end
  end

  def documents
    document_directory = "#{Rails.root}/public/pdf"
    @documents = Dir.glob("#{document_directory}/**/*").map { |path| path.split('/').last }
  end

  def feed
    current_user.is?(:admin) ? admin_feed : member_feed
  end

  def change_season
    if params[:season_id].present?
      cookies[:cap_season] = Season.find(params[:season_id]).to_json
    else
      cookies[:cap_season] = current_user.seasons.last.to_json
    end

    redirect_to root_path
  end

  private

  def admin_index
    @pending_conflicts = Conflict.pending_conflicts(current_season['id']).count
    render :admin_index
  end

  def staff_index
    render :staff_index
  end

  def member_index
    @conflicts = current_user.conflicts.includes(:conflict_status).for_season(current_season['id']).order(:start_date)
    @payments = current_user.payments_for(current_season['id']).sort_by(&:date_paid)
    @payment_schedule = current_user.payment_schedule_for(current_season['id'])
    @total_paid = @payments.sum(&:amount) / 100
    @total_dues = @payment_schedule.entries.sum(:amount) / 100
    render :member_index
  end

  def admin_feed
    respond_to do |format|
      format.html { render :feed }
      format.json do
        response = Activity.includes(:user)
                           .where('activity_date >= ?', 10.months.ago)
                           .order('activity_date DESC, created_at DESC')

        render json: response
      end
    end
  end

  def member_feed
    activities = current_user.activities.reject { |a| a.activity_type == 'login' }
    render json: activities.reverse
  end
end
