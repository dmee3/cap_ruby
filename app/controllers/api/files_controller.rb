# frozen_string_literal: true

module Api
  class FilesController < ApiController
    before_action :authenticate_user!

    def index
      @files = GoogleDriveApi.get_files(current_season['year'])
      render json: @files.to_json
    end

    def show
      @files = GoogleDriveApi.get_files(current_season['year'], params[:id])
      render json: @files.to_json
    end
  end
end
