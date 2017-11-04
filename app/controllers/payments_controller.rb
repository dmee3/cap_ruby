class PaymentsController < ApplicationController
  before_action :authorized?
  before_action -> { redirect_if_not 'admin' }, only: :create

  def index
    # Chart ideas
    #   Stream-graph of weekly totals running through the season
    #   Burn-down comparing expected and actual
    if is? 'admin'
      @payments = Payment.all
      render :admin_index
    elsif is? 'member'
      puts '**************************'
      @payments = current_user.payments.order :date_paid
      @payment_schedule = current_user.payment_schedule
      @total_paid = @payments.sum(:amount) / 100
      @total_dues = @payment_schedule.entries.sum(:amount) / 100
      puts '**************************'
      render :member_index
    else
      redirect_to root_url
    end
  end

  def new
    set_stripe_public_key

    if is? 'admin'
      @payment_types = PaymentType.all
      @members = User.where(role: Role.find_by_name('member')).order :last_name
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
      @members = User.where(role: Role.find_by_name('member')).order :last_name
      flash.now[:error] = @payment.errors.full_messages.to_sentence
      render :admin_new
    end
  end

  def admin_new
    render :add
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
      flash[:error] = 'Payment could not be submitted.  Please contact a director for help.'
      redirect_to new_payment_url
    end
  rescue StandardError => e
    Rollbar.error e, user: current_user
    flash[:error] = 'An error occurred submitting your payment.  Please contact a director for help.'
    redirect_to root_url
  end

  private

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
