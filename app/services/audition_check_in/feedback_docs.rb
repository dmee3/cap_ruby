# frozen_string_literal: true

require 'base64'

module AuditionCheckIn
  # One Google Doc per section in the feedback folder, each rewritten with a
  # block per person: name, details, their selfie, and room for feedback.
  class FeedbackDocs
    # Feedback sheet tab => doc name, where the two differ
    DOC_NAMES = { 'VE' => 'VISUAL ENSEMBLE' }.freeze

    PHOTO_WIDTH = 160
    # Fetched at three times the displayed width so it stays sharp on retina
    # screens and when someone drags it bigger.
    THUMBNAIL_SIZE = 480

    def initialize(drive_api:, folder_id:, today: Date.current)
      @drive_api = drive_api
      @folder_id = folder_id
      @today = today
    end

    # { tab => doc id }; raises before anything is written if a doc is missing
    def find(tabs)
      docs = drive_api.docs_in_folder(folder_id).transform_keys { |name| name.strip.upcase }
      ids = tabs.index_with { |tab| docs[doc_name(tab)] }
      missing = ids.select { |_tab, id| id.nil? }.keys.map { |tab| doc_name(tab) }
      return ids if missing.empty?

      raise Error, "The feedback docs folder has no doc named #{missing.to_sentence}, so nothing was written"
    end

    # Returns [photos embedded, people without one]
    def write(doc_ids, people_by_tab)
      photos = missing = 0
      doc_ids.each do |tab, doc_id|
        blocks = people_by_tab.fetch(tab, []).map do |person|
          photo = photo_for(person)
          photo ? photos += 1 : missing += 1
          person_html(person, photo)
        end
        drive_api.replace_doc_with_html(doc_id, doc_html(doc_name(tab), blocks))
      end
      [photos, missing]
    end

    private

    attr_reader :drive_api, :folder_id, :today

    def doc_name(tab)
      DOC_NAMES.fetch(tab, tab)
    end

    def photo_for(person)
      return nil unless person.selfie_file_id

      bytes, type = drive_api.image_thumbnail(person.selfie_file_id, size: THUMBNAIL_SIZE)
      "data:#{type};base64,#{Base64.strict_encode64(bytes)}" if bytes
    end

    def doc_html(title, blocks)
      body = blocks.presence || ["<p><i>Nobody has checked in for #{h(title.downcase)} yet.</i></p>"]
      "<html><body><h1>#{h(title)}</h1>#{body.join}</body></html>"
    end

    def person_html(person, photo)
      details = {
        'Pronouns' => person.pronouns,
        'Age' => person.age(on: today),
        'Birthday' => person.birthday,
        'Email' => person.email
      }.map { |label, value| "<b>#{label}:</b> #{h(value.presence || '—')}" }

      <<~HTML
        <h2>#{h(person.full_name)}</h2>
        <p>#{details.join('<br>')}</p>
        #{photo ? %(<p><img src="#{photo}" width="#{PHOTO_WIDTH}"></p>) : '<p><i>No selfie</i></p>'}
        <p><b>Feedback:</b></p>
        <p></p>
      HTML
    end

    def h(value)
      ERB::Util.html_escape(value.to_s)
    end
  end
end
