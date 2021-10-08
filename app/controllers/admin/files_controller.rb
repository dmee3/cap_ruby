# frozen_string_literal: true

module Admin
  class FilesController < AdminController
    before_action :authenticate_user!

    def index; end
  end
end
