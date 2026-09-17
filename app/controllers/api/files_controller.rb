# frozen_string_literal: true

module Api
  class FilesController < ApiController
    before_action :authenticate_user!

    def index
      render_files
    end

    def show
      render_files
    end

    private

    # A remote call on a page load will fail eventually, and the list had no
    # answer for that: the client's only handler logged to the console and left
    # the skeleton up forever. Both failures now come back as statuses the
    # screen can say something about.
    def render_files
      files = External::GoogleDriveApi.get_files(current_season['year'], params[:id].to_s)
      render json: files
    rescue External::GoogleDriveApi::UnconfiguredSeason => e
      Rails.logger.warn(e.message)
      render json: { error: 'unconfigured_season' }, status: :not_found
    rescue StandardError => e
      Rollbar.error(e, user: current_user)
      render json: { error: 'drive_unavailable' }, status: :bad_gateway
    end
  end
end
