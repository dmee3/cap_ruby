class PaymentsController < ApplicationController
  before_action :authorized?
  before_action -> { redirect_if_not 'admin' }, except: %i[index new charge]

  def index
    if is? 'admin'
      @members = User.where(role: Role.find_by_name('member'))
                     .includes(:payments, payment_schedule: :payment_schedule_entries)
                     .order :first_name
      render :admin_index
    elsif is? 'member'
      set_member_index_variables
      render :member_index
    end
  end

  def new
    set_stripe_public_key

    if is? 'admin'
      @payment_types = PaymentType.all
      @members = User.where(role: Role.find_by_name('member')).order :first_name
      @payment = Payment.new
      render :admin_new
    else
      render :member_new
    end
  end

  def create
    @payment = Payment.new payment_params
    @payment.amount *= 100 if @payment.amount
    if @payment.save
      flash[:success] = 'Payment created'
      redirect_to payments_path
    else
      @payment_types = PaymentType.all
      @members = User.where(role: Role.find_by_name('member')).order :first_name
      flash.now[:error] = @payment.errors.full_messages.to_sentence
      render :admin_new
    end
  end

  def charge
    set_stripe_secret_key

    response = Stripe::Charge.create amount: params[:charge_amount],
                                     currency: 'usd',
                                     source: params[:stripe_token],
                                     description: 'Cap City Dues Payment'

    payment = Payment.new user: current_user,
                          payment_type: PaymentType.find_by_name('Stripe'),
                          amount: params[:payment_amount].to_i * 100,
                          date_paid: Date.today,
                          notes: "Stripe Payment - Charge ID: #{response.id}"
    if payment.save
      flash[:success] = 'Payment submitted.  Thank you!'
      redirect_to root_url
    else
      Rollbar.info('Payment could not be submitted.  Please check Stripe for transaction.', errors: payment.errors.full_messages)
      flash[:error] = 'Payment could not be submitted.  Please contact a director for help.'
      redirect_to new_payment_url
    end
  rescue StandardError => e
    Rollbar.error(e, user: current_user)
    flash[:error] = 'Payment could not be submitted.  Please contact a director for help.'
    redirect_to root_url
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
      end_date = Date.today + 1.month
    end

    render(json: { payments: DashboardUtilities.upcoming_payments(start_date, end_date) })
  end

  def behind_members
    render(json: { members: DashboardUtilities.behind_members })
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

  def set_member_index_variables
    @payments = current_user.payments.order :date_paid
    @payment_schedule = current_user.payment_schedule
    @total_paid = @payments.sum(:amount) / 100
    @total_dues = @payment_schedule.entries.sum(:amount) / 100
  end

  def set_stripe_public_key
    if Rails.env == 'production'
      @stripe_public_key = ENV['STRIPE_PUBLIC_KEY']
    else
      @stripe_public_key = ENV['STRIPE_PUBLIC_TEST_KEY']
    end
  end

  def set_stripe_secret_key
    if Rails.env == 'production'
      Stripe.api_key = ENV['STRIPE_SECRET_KEY']
    else
      Stripe.api_key = ENV['STRIPE_SECRET_TEST_KEY']
    end
  end

  def charge_params
    params.permit :stripe_token, :payment_amount, :charge_amount
  end

  def payment_params
    params.require(:payment).permit :user_id, :payment_type_id, :amount, :date_paid, :notes
  end
end
