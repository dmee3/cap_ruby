# frozen_string_literal: true

class AuditionsController < ApplicationController
  def index; end

  # rubocop:disable Metrics/AbcSize
  def update
    if !AuditionsProcessor.run
      render 'auditions/google_failure'
      return
    end

    render 'auditions/success'
  rescue ApiErrors::TooManyRequests => e
    render 'auditions/rate_limited'
  end
  # rubocop:enable Metrics/AbcSize
end
