# frozen_string_literal: true

module AuditionCheckIn
  # Finds a check-in's registration on the Registrations tab, which the
  # auditions sync writes as sections: a group title ("Music Registration
  # (121 registrations)"), a column header row, then instrument sub-headings,
  # each followed by its people. Only rows under a header row are people.
  class RegistrationLookup
    Registration = Struct.new(:pronouns, :birthday, keyword_init: true)

    COLUMNS = {
      first_name: 'First Name',
      last_name: 'Last Name',
      email: 'Email',
      pronouns: 'Pronouns',
      birthday: 'Birthdate'
    }.freeze

    def self.name_key(first_name, last_name)
      "#{first_name} #{last_name}".squish.downcase
    end

    def initialize(rows)
      @by_name = {}
      @by_email = {}
      index(rows)
    end

    def find(first_name:, last_name:, email:)
      @by_name[self.class.name_key(first_name, last_name)] || @by_email[email.to_s.strip.downcase]
    end

    private

    def index(rows)
      columns = nil
      rows.each do |row|
        if row.first.to_s.strip == COLUMNS[:first_name]
          columns = column_indexes(row)
        elsif columns && person_row?(row)
          remember(row, columns)
        end
      end
    end

    def column_indexes(header)
      COLUMNS.transform_values do |label|
        header.index(label) or raise Error, "The Registrations tab has no '#{label}' column"
      end
    end

    # Section titles and instrument sub-headings are a single filled cell.
    def person_row?(row)
      row.count(&:present?) > 1
    end

    def remember(row, columns)
      registration = Registration.new(pronouns: row[columns[:pronouns]].to_s.strip,
                                      birthday: row[columns[:birthday]].to_s.strip)
      name = self.class.name_key(row[columns[:first_name]], row[columns[:last_name]])
      email = row[columns[:email]].to_s.strip.downcase

      @by_name[name] ||= registration if name.present?
      @by_email[email] ||= registration if email.present?
    end
  end
end
