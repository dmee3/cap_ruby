# frozen_string_literal: true

require 'google/apis/drive_v3'

class GoogleDriveApi
  include Singleton

  class << self
    def get_files(year, folder = '')
      instance.get_files(year, folder)
    end
  end

  def initialize
    scope = Google::Apis::DriveV3::AUTH_DRIVE
    authorization = Google::Auth.get_application_default(scope)

    # Initialize the API
    @service = Google::Apis::DriveV3::DriveService.new
    service.authorization = authorization
  end

  def get_files(year, folder_id)
    if folder_id.blank?
      folder_id = ENV.fetch("BASE_DRIVE_FOLDER_ID_#{year}")
    end
    result = service.list_files(q: "'#{folder_id}' in parents", page_size: 100)
    format(result.files)
  end

  private

  attr_reader :service

  FILE_TYPES = {
    'application/vnd.google-apps.document' => :document,
    'application/vnd.google-apps.folder' => :folder,
    'audio/mpeg' => :audio,
    'application/pdf' => :pdf
  }.freeze

  def format(files)
    files.map do |f|
      {
        id: f.id,
        name: f.name,
        file_type: FILE_TYPES[f.mime_type] || f.mime_type
      }
    end
  end
end
