# frozen_string_literal: true

class FilesController < ApplicationController
  before_action :authenticate_user!

  def index; end
end
