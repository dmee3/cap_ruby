# frozen_string_literal: true

class AuditionsController < ApplicationController
  def index; end

  def update
    unless Auditions::SpreadsheetService.update
      render 'auditions/google_failure'
      return
    end

    render 'auditions/success'
  rescue ApiErrors::TooManyRequests => e
    render 'auditions/rate_limited'
  end
end
