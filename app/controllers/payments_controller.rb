class PaymentsController < ApplicationController
  before_action :authorized?
  before_action -> { redirect_if_not('admin') }, except: %i[new charge]

  def index
    @members = User.for_season(current_season['id'])
                   .with_role(:member)
                   .with_payments
                   .order(:first_name)
    render :admin_index
  end

  def new
    set_stripe_public_key

    if current_user.is?(:admin)
      @members = User.for_season(current_season['id']).with_role(:member).order(:first_name)
      @payment = Payment.new
      @payment.user_id = params[:user_id] if params[:user_id]
      render :admin_new
    else
      render :member_new
    end
  end

  # Don't panic, this is admin-only
  def create
    @payment = Payment.new(payment_params)
    @payment.amount *= 100 if @payment.amount
    @payment.season_id = current_season['id']
    if @payment.save
      flash[:success] = 'Payment created'
      ActivityLogger.log_payment(@payment, current_user)
      redirect_to(payments_path)
    else
      @members = User.for_season(current_season['id']).with_role(:member).order(:first_name)
      flash.now[:error] = @payment.errors.full_messages.to_sentence
      render :admin_new
    end
  end

  # Serves as "create" method for member-initiated payments
  def charge
    set_stripe_secret_key

    response = Stripe::Charge.create(
      amount: params[:charge_amount],
      currency: 'usd',
      description: 'Cap City Dues Payment',
      source: params[:stripe_token]
    )

    @payment = Payment.new(
      amount: params[:payment_amount].to_i * 100,
      date_paid: Date.today,
      notes: "Stripe Payment - Charge ID: #{response.id}",
      payment_type: PaymentType.find_by_name('Stripe'),
      season_id: current_season['id'],
      user: current_user
    )

    if @payment.save
      flash[:success] = 'Payment submitted. Thank you!'
      ActivityLogger.log_payment(@payment, current_user)
      redirect_to(root_url)
    else
      Rollbar.info('Payment could not be submitted. Please check Stripe for transaction.', errors: @payment.errors.full_messages)
      flash[:error] = 'Payment could not be submitted. Please contact a director for help.'
      redirect_to(new_payment_url)
    end
  rescue StandardError => e
    Rollbar.error(e, user: current_user)
    flash[:error] = 'Payment could not be submitted. Please contact a director for help.'
    redirect_to(root_url)
  end

  def differential_chart
    render(
      json: {
        scheduled: DashboardUtilities.payment_schedule_sums_by_week,
        actual: DashboardUtilities.payment_sums_by_week
      }
    )
  end

  def upcoming_payments
    begin
      start_date = Date.parse(params[:start_date])
      end_date = Date.parse(params[:end_date])
    rescue TypeError, ArgumentError
      start_date = Date.today
      end_date = 2.weeks.from_now
    end

    render(json: {
      payments: DashboardUtilities.upcoming_payments(start_date, end_date, current_season['id'])
    })
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

  def set_stripe_public_key
    if Rails.env.production? && !ENV['STAGING']
      @stripe_public_key = ENV['STRIPE_PUBLIC_KEY']
    else
      @stripe_public_key = ENV['STRIPE_PUBLIC_TEST_KEY']
    end
  end

  def set_stripe_secret_key
    if Rails.env.production? && !ENV['STAGING']
      Stripe.api_key = ENV['STRIPE_SECRET_KEY']
    else
      Stripe.api_key = ENV['STRIPE_SECRET_TEST_KEY']
    end
  end

  def payment_params
    params.require(:payment).permit(:user_id, :payment_type_id, :amount, :date_paid, :notes)
  end
end
