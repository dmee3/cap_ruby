class Admin::PaymentsController < ApplicationController
  before_action :logout_if_unauthorized
  before_action -> { redirect_if_not('admin') }

  def index
    respond_to do |format|
      format.html { render('admin/payments/index') }
      format.json do
        @payments = Payment
          .includes(:payment_type)
          .joins(:payment_type)
          .for_season(current_season['id'])
        render json: { payments: @payments }, include: [:payment_type]
      end
    end
  end

  def new
    @members = User.for_season(current_season['id']).with_role(:member).order(:first_name)
    @payment = Payment.new
    @payment.user_id = params[:user_id] if params[:user_id]
    render('admin/payments/new')
  end

  def create
    @payment = Payment.new(payment_params)
    @payment.amount *= 100 if @payment.amount
    @payment.season_id = current_season['id']
    if @payment.save
      flash[:success] = 'Payment created'
      ActivityLogger.log_payment(@payment, current_user)
      redirect_to(admin_payments_path)
    else
      @members = User.for_season(current_season['id']).with_role(:member).order(:first_name)
      flash.now[:error] = @payment.errors.full_messages.to_sentence
      render('admin/payments/new')
    end
  end

  def upcoming_payments
    begin
      start_date = Date.parse(params[:start_date])
      end_date = Date.parse(params[:end_date])
    rescue TypeError, ArgumentError
      start_date = Date.today
      end_date = Date.today + 2.weeks
    end

    render(
      json: {
        payments: DashboardUtilities.upcoming_payments(start_date, end_date, current_season['id'])
      }
    )
  end

  def recent_payments
    begin
      start_date = Date.parse(params[:start_date])
      end_date = Date.parse(params[:end_date])
    rescue TypeError, ArgumentError
      start_date = Date.today - 1.week
      end_date = Date.today
    end

    render(
      json: {
        payments: DashboardUtilities.recent_payments(start_date, end_date, current_season['id'])
      }
    )
  end

  def behind_members
    render(json: { members: DashboardUtilities.behind_members(current_season['id']) })
  end

  def burndown_chart
    render(
      json: {
        scheduled: DashboardUtilities.biweekly_scheduled,
        actual: DashboardUtilities.biweekly_actual
      }
    )
  end

  private

  def payment_params
    params.require(:payment).permit(:user_id, :payment_type_id, :amount, :date_paid, :notes)
  end
end
