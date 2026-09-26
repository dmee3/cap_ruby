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

      def docs_in_folder(folder_id)
        instance.docs_in_folder(folder_id)
      end

      def image_thumbnail(file_id, size:)
        instance.image_thumbnail(file_id, size: size)
      end

      def replace_doc_with_html(doc_id, html)
        instance.replace_doc_with_html(doc_id, html)
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

    # Raised instead of returning [] so the screen can tell "this season has no
    # folder set up" apart from "the folder is empty" — they need different
    # sentences, and only one of them is something an admin has to fix.
    class UnconfiguredSeason < StandardError; end

    def get_files(year, folder_id)
      if folder_id.blank?
        folder_id = ENV.fetch("BASE_DRIVE_FOLDER_ID_#{year}", nil)
        raise UnconfiguredSeason, "no Drive folder configured for #{year}" if folder_id.blank?
      end

      result = service.list_files(q: "'#{folder_id}' in parents", page_size: 100)
      format(result.files)
    end

    # { name => id } for the Google Docs directly inside a folder
    def docs_in_folder(folder_id)
      result = service.list_files(
        q: "'#{folder_id}' in parents and mimeType = 'application/vnd.google-apps.document' and trashed = false",
        fields: 'files(id,name)', page_size: 100
      )
      result.files.to_h { |file| [file.name, file.id] }
    end

    # A downscaled copy of an image file as [bytes, content type], or nil when
    # the file isn't an image or can't be read. Drive renders thumbnails at any
    # size up to the original, so this avoids pulling a full phone photo.
    def image_thumbnail(file_id, size:)
      file = service.get_file(file_id, fields: 'mimeType,thumbnailLink')
      return nil unless file.mime_type.to_s.start_with?('image/') && file.thumbnail_link

      url = file.thumbnail_link.sub(/=s\d+\z/, "=s#{size}")
      response = Faraday.get(url, nil, service.authorization.apply({}))
      type = response.headers['content-type'].to_s
      [response.body, type] if response.status == 200 && type.start_with?('image/')
    rescue Google::Apis::Error, Faraday::Error
      nil
    end

    # Replaces a Google Doc's whole body; Drive converts the HTML on upload.
    def replace_doc_with_html(doc_id, html)
      service.update_file(doc_id, upload_source: StringIO.new(html), content_type: 'text/html')
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
