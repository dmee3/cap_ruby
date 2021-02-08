class Members::PaymentsController < ApplicationController
  before_action :logout_if_unauthorized

  def new
    set_stripe_public_key
    render('members/payments/new')
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
      send_email
      redirect_to(root_url)
    else
      Rollbar.info('Payment could not be submitted. Please check Stripe for transaction.', errors: @payment.errors.full_messages)
      flash[:error] = 'Payment could not be submitted. Please contact a director for help.'
      redirect_to(new_payment_path)
    end
  rescue StandardError => e
    Rollbar.error(e, user: current_user)
    flash[:error] = 'Payment could not be submitted. Please contact a director for help.'
    redirect_to(root_url)
  end

  private

  def send_email
    subject = "Payment submitted by #{current_user.full_name} for $#{@payment.amount / 100}"
    text = "#{current_user.full_name} has submitted a payment for $#{@payment.amount / 100}."
    [ENV['EMAIL_AARON'], ENV['EMAIL_DAN']].each do |to|
      PostOffice.send_email(to, subject, text)
    end

  # Suppress all exceptions because it's just an email
  rescue StandardError => e
    Rollbar.error(e, user: current_user)
  end
end
