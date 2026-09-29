# frozen_string_literal: true

require 'base64'

module AuditionCheckIn
  # One Google Doc per section in the feedback folder, each rewritten with a
  # block per person: name, details, their selfie, and room for feedback.
  class FeedbackDocs
    # Feedback sheet tab => doc name, where the two differ
    DOC_NAMES = { 'VE' => 'VISUAL ENSEMBLE' }.freeze

    PHOTO_WIDTH = 213
    # Fetched at three times the displayed width so it stays sharp on retina
    # screens and when someone drags it bigger.
    THUMBNAIL_SIZE = PHOTO_WIDTH * 3
    PHOTO_FETCHES_AT_ONCE = 8
    FEEDBACK_BLANK_LINES = 3

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
      people = doc_ids.keys.flat_map { |tab| people_by_tab.fetch(tab, []) }
      photos = photos_for(people)

      doc_ids.each do |tab, doc_id|
        blocks = people_by_tab.fetch(tab, []).each_with_index.map do |person, index|
          person_html(person, photos[person], new_page: index.positive?)
        end
        drive_api.replace_doc_with_html(doc_id, doc_html(doc_name(tab), blocks))
      end

      embedded = photos.values.count(&:present?)
      [embedded, people.size - embedded]
    end

    private

    attr_reader :drive_api, :folder_id, :today

    def doc_name(tab)
      DOC_NAMES.fetch(tab, tab)
    end

    # Each photo is two Drive round trips, so one at a time a few dozen
    # check-ins run past Heroku's 30-second request limit.
    def photos_for(people)
      pool = Concurrent::FixedThreadPool.new(PHOTO_FETCHES_AT_ONCE)
      futures = people.map { |person| Concurrent::Promises.future_on(pool) { photo_for(person) } }
      # Waiting inside a request holds Rails' code-loading lock; releasing it
      # means a fetch thread that needs to autoload can't deadlock against us.
      photos = ActiveSupport::Dependencies.interlock.permit_concurrent_loads { futures.map(&:value!) }
      people.zip(photos).to_h
    ensure
      pool&.shutdown
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

    def person_html(person, photo, new_page:)
      details = {
        'Pronouns' => person.pronouns,
        'Age' => person.age(on: today),
        'Birthday' => person.birthday,
        'Email' => person.email
      }.map { |label, value| "<b>#{label}:</b> #{h(value.presence || '—')}" }

      <<~HTML
        <h2#{' style="page-break-before: always"' if new_page}>#{h(person.full_name)}</h2>
        <p>#{details.join('<br>')}</p>
        #{photo ? %(<p><img src="#{photo}" width="#{PHOTO_WIDTH}"></p>) : '<p><i>No selfie</i></p>'}
        <p><b>Feedback:</b></p>
        #{'<p><br></p>' * FEEDBACK_BLANK_LINES}
      HTML
    end

    def h(value)
      ERB::Util.html_escape(value.to_s)
    end
  end
end
