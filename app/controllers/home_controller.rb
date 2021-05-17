class HomeController < ApplicationController
  before_action :logout_if_unauthorized

  def index
    if current_user.is?(:admin)
      render('admin/home/index')
    elsif current_user.is?(:member)
      @conflicts = current_user.conflicts.includes(:conflict_status).for_season(current_season['id']).order(:start_date)
      @documents = find_documents
      @payments = current_user.payments_for(current_season['id']).sort_by(&:date_paid)
      @payment_schedule = current_user.payment_schedule_for(current_season['id'])
      @total_paid = @payments.sum(&:amount) / 100
      @total_dues = @payment_schedule.entries.sum(:amount) / 100
      render('members/home/index')
    else
      Rollbar.warning('User with unknown role accessed home page.')
      logout
    end
  end

  def documents
    @documents = find_documents
    render 'admin/home/documents'
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

  def find_documents
    document_directory = "#{Rails.root}/public/pdf"
    Dir.glob("#{document_directory}/**/*").map { |path| path.split('/').last }
  end
end
