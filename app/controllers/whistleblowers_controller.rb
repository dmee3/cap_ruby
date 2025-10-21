# frozen_string_literal: true

class WhistleblowersController < ApplicationController
  before_action :authenticate_user!

  def index; end

  def create
    # Validate that at least 3 recipients are selected
    if params[:recipients].nil? || params[:recipients].length < 3
      flash.now[:error] = 'Please select at least 3 administrators to notify.'
      render(:index)
      return
    end

    EmailService.send_whistleblower_email(params[:email], params[:report], params[:recipients])
    flash[:success] =
      'Report submitted. If you provided contact information, expect a response within a week.'
    redirect_to(root_path)
  rescue StandardError => e
    Rails.logger.error(e)
    Rollbar.error(e, user: nil)
    flash.now[:error] = 'Our system has encountered an error. Please try again.'
    render(:index)
  end
end
