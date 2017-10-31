class PaymentsController < ApplicationController
  before_action :authorized?

  def index
    if is? 'admin'
      @payments = Payment.all
      render :admin_index
    elsif is? 'member'
      render :member_index
    else
      redirect_to root_url
    end
  end

  def new
    if Rails.env == 'production'
      @stripe_public_key = ENV['STRIPE_PUBLIC_KEY']
    else
      @stripe_public_key = ENV['STRIPE_PUBLIC_TEST_KEY']
    end
  end

  def charge
    set_stripe_api_key

    response = Stripe::Charge.create amount: params[:charge_amount],
                                     currency: 'usd',
                                     source: params[:stripe_token],
                                     description: 'Cap City Dues Payment'

    payment = Payment.new user: current_user,
                          payment_type: PaymentType.find_by_name('stripe'),
                          amount: params[:payment_amount].to_i * 100,
                          date_paid: Date.today,
                          notes: "Stripe Payment - Charge ID: #{response.id}"
    if payment.save
      flash[:success] = 'Payment submitted.  Thank you!'
      redirect_to root_url
    else
      flash[:error] = 'Payment could not be submitted.  Please contact a director for help.'
      redirect_to '/payments/new'
    end
  rescue StandardError => e
    Rollbar.error(e, user: current_user)
    flash[:error] = 'An error occurred submitting your payment.  Please contact a director for help.'
    redirect_to root_url
  end

  private

  def set_stripe_api_key
    if Rails.env == 'production'
      Stripe.api_key = ENV['STRIPE_SECRET_KEY']
    else
      Stripe.api_key = ENV['STRIPE_SECRET_TEST_KEY']
    end
  end

  def charge_params
    params.permit(:stripe_token, :payment_amount, :charge_amount)
  end
end
