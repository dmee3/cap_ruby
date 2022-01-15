# frozen_string_literal: true

module Members
  class PaymentsController < ApplicationController
    before_action :authenticate_user!

    def new
      set_stripe_public_key
      render('members/payments/new')
    end

    # Callback method from stripe payment processing
    def post_processing
      if params['redirect_status'] == 'succeeded'
        flash[:success] =
          'Payment submitted. Thank you! Please wait a moment and refresh to see your dues updated.'
      else
        flash[:error] =
          'Payment could not be submitted. Please contact a director for further help.'
      end
      redirect_to(root_url)
    end
  end
end
