# frozen_string_literal: true

class WhistleblowersController < ApplicationController
  before_action :authenticate_user!

  def index; end

  def create
    EmailService.send_whistleblower_email(params[:email], params[:report])
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
