# frozen_string_literal: true

require 'google/apis/drive_v3'
require 'json'
require 'tempfile'

module External
  class GoogleDriveApi
    include Singleton

    class << self
      def get_files(year, folder = '')
        instance.get_files(year, folder)
      end
    end

    def initialize
      scope = Google::Apis::DriveV3::AUTH_DRIVE

      # Create temporary credentials file from environment variable
      credentials_json = ENV.fetch('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS', nil)
      if credentials_json
        @temp_credentials_file = create_temp_credentials_file(credentials_json)
        ENV['GOOGLE_APPLICATION_CREDENTIALS'] = @temp_credentials_file.path
      end

      authorization = Google::Auth.get_application_default(scope)

      # Initialize the API
      @service = Google::Apis::DriveV3::DriveService.new
      service.authorization = authorization
    end

    FILE_TYPES = {
      'application/vnd.google-apps.document' => :document,
      'application/vnd.google-apps.folder' => :folder,
      'audio/mpeg' => :audio,
      'application/pdf' => :pdf
    }.freeze

    def get_files(year, folder_id)
      folder_id = ENV.fetch("BASE_DRIVE_FOLDER_ID_#{year}") if folder_id.blank?
      result = service.list_files(q: "'#{folder_id}' in parents", page_size: 100)
      format(result.files)
    end

    private

    attr_reader :service

    def create_temp_credentials_file(credentials_json)
      temp_file = Tempfile.new('google_credentials')
      temp_file.write(credentials_json)
      temp_file.rewind
      temp_file
    end

    def format(files)
      files.map do |f|
        {
          id: f.id,
          name: f.name,
          file_type: FILE_TYPES[f.mime_type] || f.mime_type
        }
      end
    end

    def cleanup_temp_files
      @temp_credentials_file&.close
      @temp_credentials_file&.unlink
    end
  end
end
